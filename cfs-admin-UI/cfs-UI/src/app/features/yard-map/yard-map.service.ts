import { Injectable, computed, signal, inject } from '@angular/core';
import {
  ParkingSlot,
  YardZoneSummary,
  YardEquipmentItem,
  MovingVehicle,
  YardMapTelemetry,
  ParkingSlotStatus,
  YardZoneType,
} from './yard-map.models';
import { CFS_GPS_SLOTS, CFS_GEO_BOUNDS, CfsGpsSlot, GpsCoordinate } from './yard-map-data';
import { AuthService } from 'core/auth/auth.service';

function projectGpsToCanvas(lat: number, lng: number): { x: number; y: number } {
  const minLat = 18.9016;
  const maxLat = 18.904;
  const minLng = 73.0454;
  const maxLng = 73.0474;

  const normX = (lng - minLng) / (maxLng - minLng);
  const normY = (maxLat - lat) / (maxLat - minLat); // inverted for canvas/screen Y

  const x = Math.max(4, Math.min(96, 6 + normX * 88));
  const y = Math.max(6, Math.min(94, 8 + normY * 84));
  return { x: +x.toFixed(2), y: +y.toFixed(2) };
}

function mapGpsSlotToParkingSlot(g: CfsGpsSlot): ParkingSlot {
  const centerPos = projectGpsToCanvas(g.center.lat, g.center.lng);
  const svgPoints = g.polygon
    .map((p: GpsCoordinate) => {
      const pt = projectGpsToCanvas(p.lat, p.lng);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  let zone: YardZoneType = 'truck-parking';
  if (g.block === 'A') zone = 'stacking-import';
  else if (g.block === 'B') zone = 'stacking-export';
  else if (g.block === 'C') zone = 'empty-depot';
  else if (g.block === 'D') zone = 'truck-parking';
  else if (g.block === 'F') zone = 'truck-parking';
  else if (g.block === 'I') zone = 'inspection-bay';
  else if (g.block === 'H') zone = 'reefer-parking';

  return {
    id: g.id,
    code: g.code,
    name: g.name,
    block: g.block,
    row: g.row,
    bay: g.bay,
    zone,
    zoneLabel: g.zoneType,
    cycle: g.cycle || 'General Staging Cycle',
    status: g.status,
    lat: g.center.lat,
    lng: g.center.lng,
    xPercent: centerPos.x,
    yPercent: centerPos.y,
    widthPercent: 4.5,
    heightPercent: 3.5,
    polygonPoints: g.polygon,
    svgPoints,
    truckNumber: g.truckNumber,
    driverName: g.driverName,
    driverPhone: g.driverPhone,
    transporter: g.transporter,
    containerNumber: g.containerNumber,
    isoCode: g.isoCode,
    shippingLine: g.shippingLine,
    cargoType: g.cargoType,
    temperature: g.temperature,
    sealNumber: g.sealNumber,
    grossWeightKg: g.grossWeightKg,
    dwellTime: g.dwellTime,
    entryTime: g.entryTime,
    assignedTask: g.assignedTask,
    tierLevel: g.tierLevel,
    maxTiers: g.maxTiers,
    priority: g.priority,
  };
}

@Injectable({
  providedIn: 'root',
})
export class YardMapService {
  private readonly auth = inject(AuthService, { optional: true });

  // Filter signals
  public readonly selectedZoneFilter = signal<string>('all');
  public readonly selectedStatusFilter = signal<string>('all');
  public readonly searchQuery = signal<string>('');
  public readonly simulationActive = signal<boolean>(true);
  public readonly selectedSlot = signal<ParkingSlot | null>(null);

  // Map mode: 'satellite' | 'hybrid' | 'blueprint' | 'vector'
  public readonly mapDisplayMode = signal<'satellite' | 'hybrid' | 'blueprint' | 'vector'>('hybrid');

  // Master Parking & Yard Slots projected from real survey GPS coordinates
  private readonly _slots = signal<ParkingSlot[]>(CFS_GPS_SLOTS.map(mapGpsSlotToParkingSlot));

  // Live Equipment Tracking
  public readonly equipment = signal<YardEquipmentItem[]>([
    {
      id: 'EQ-01',
      name: 'Reach Stacker RS-101',
      type: 'Reach Stacker',
      operator: 'Mahesh Patil (Cert A)',
      status: 'active',
      currentLocation: 'Lane D-06 (Central Aisle)',
      taskDescription: 'Stacking MAEU 991204-7 to Tier 3',
      xPercent: 52,
      yPercent: 48,
      headingDeg: 45,
    },
    {
      id: 'EQ-02',
      name: 'Heavy Forklift FL-04 (16 Ton)',
      type: 'Heavy Forklift',
      operator: 'Dilip Rane',
      status: 'active',
      currentLocation: 'Inspection Bay Ramp I-1',
      taskDescription: 'Unloading Heavy Machinery Cargo',
      xPercent: 18,
      yPercent: 86,
      headingDeg: 270,
    },
    {
      id: 'EQ-03',
      name: 'Terminal Tractor TT-08',
      type: 'Terminal Tractor',
      operator: 'Suresh More',
      status: 'active',
      currentLocation: 'Main Transit Way (Block C to Gate)',
      taskDescription: 'Hauling Empty Container to Block C-1',
      xPercent: 58,
      yPercent: 22,
      headingDeg: 180,
    },
  ]);

  // Moving Vehicles Animation State
  public readonly movingVehicles = signal<MovingVehicle[]>([
    {
      id: 'MV-01',
      truckNumber: 'MH-46-AR-8821',
      containerNumber: 'MSKU 910283-4',
      driverName: 'Rajesh Sharma',
      source: 'Gate OCR Lane 1',
      target: 'Slot C-1 8',
      progressPercent: 72,
      statusText: 'Navigating GPS Artery to Slot C-1 8',
      type: 'ENTRY_TO_BAY',
    },
    {
      id: 'MV-02',
      truckNumber: 'GJ-06-TT-5510',
      containerNumber: 'MEDU 839102-4',
      driverName: 'Harish Patel',
      source: 'Block B-3 (Export)',
      target: 'Weighbridge Gate',
      progressPercent: 38,
      statusText: 'Container moving to weighbridge for gross certification',
      type: 'INTERNAL_SHUFFLE',
    },
  ]);

  // Read-only accessors
  public readonly slots = this._slots.asReadonly();

  // Zone Summaries
  public readonly zoneSummaries = computed<YardZoneSummary[]>(() => {
    const all = this._slots();
    const zones: {
      id: YardZoneType;
      name: string;
      shortCode: string;
      badgeColor: string;
      bgRgba: string;
      borderColor: string;
    }[] = [
      {
        id: 'truck-parking',
        name: 'Block D & F (Parking & Staging)',
        shortCode: 'TRK',
        badgeColor: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/70',
        bgRgba: 'rgba(14, 165, 233, 0.12)',
        borderColor: 'border-sky-500/50',
      },
      {
        id: 'stacking-import',
        name: 'Block A (Import Stacking)',
        shortCode: 'IMP',
        badgeColor: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70',
        bgRgba: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'border-blue-500/50',
      },
      {
        id: 'stacking-export',
        name: 'Block B (Export Stacking)',
        shortCode: 'EXP',
        badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70',
        bgRgba: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'border-emerald-500/50',
      },
      {
        id: 'empty-depot',
        name: 'Block C (Empty Depot)',
        shortCode: 'EMP',
        badgeColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/70',
        bgRgba: 'rgba(99, 102, 241, 0.12)',
        borderColor: 'border-indigo-500/50',
      },
      {
        id: 'reefer-parking',
        name: 'Block H (Reefer / Transit)',
        shortCode: 'RFR',
        badgeColor: 'text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/70',
        bgRgba: 'rgba(6, 182, 212, 0.14)',
        borderColor: 'border-cyan-500/50',
      },
      {
        id: 'inspection-bay',
        name: 'Block I (Customs Shed)',
        shortCode: 'INSP',
        badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70',
        bgRgba: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'border-amber-500/50',
      },
    ];

    return zones.map((z) => {
      const zoneSlots = all.filter((s) => s.zone === z.id);
      const total = zoneSlots.length;
      const occupied = zoneSlots.filter((s) => s.status === 'occupied' || s.status === 'incoming').length;
      const utilization = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return {
        id: z.id,
        name: z.name,
        shortCode: z.shortCode,
        badgeColor: z.badgeColor,
        bgRgba: z.bgRgba,
        borderColor: z.borderColor,
        totalSlots: total,
        occupiedSlots: occupied,
        utilization,
      };
    });
  });

  // Telemetry KPIs
  public readonly telemetry = computed<YardMapTelemetry>(() => {
    const all = this._slots();
    const occupiedSlots = all.filter((s) => s.status === 'occupied' || s.status === 'incoming').length;
    const totalSlots = all.length;
    const reeferOccupied = all.filter(
      (s) => s.cargoType === 'Reefer' || (s.zone === 'reefer-parking' && s.status === 'occupied'),
    ).length;

    return {
      totalParkingBays: totalSlots,
      occupiedParkingBays: occupiedSlots,
      parkingUtilization: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
      totalContainerSlots: totalSlots,
      occupiedContainerSlots: occupiedSlots,
      teuCapacity: 1200,
      currentTeu: 842,
      liveTrucksInYard: all.filter((s) => !!s.truckNumber).length + this.movingVehicles().length,
      avgTurnaroundMinutes: 28,
      activeEquipment: this.equipment().filter((e) => e.status === 'active').length,
      reeferActiveCount: reeferOccupied,
      gateLanesActive: 2,
    };
  });

  // Filtered Slots
  public readonly filteredSlots = computed<ParkingSlot[]>(() => {
    let result = this._slots();
    const zone = this.selectedZoneFilter();
    const status = this.selectedStatusFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (zone !== 'all') {
      result = result.filter((s) => s.zone === zone);
    }

    if (status !== 'all') {
      result = result.filter((s) => s.status === status);
    }

    if (q) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.truckNumber && s.truckNumber.toLowerCase().includes(q)) ||
          (s.containerNumber && s.containerNumber.toLowerCase().includes(q)) ||
          (s.driverName && s.driverName.toLowerCase().includes(q)) ||
          (s.shippingLine && s.shippingLine.toLowerCase().includes(q)) ||
          (s.assignedTask && s.assignedTask.toLowerCase().includes(q)),
      );
    }

    return result;
  });

  private animationInterval: any = null;

  constructor() {
    this.startSimulationLoop();
  }

  public startSimulationLoop(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    this.animationInterval = setInterval(() => {
      if (!this.simulationActive()) return;

      // Increment vehicle movement progress
      this.movingVehicles.update((list) =>
        list.map((mv) => {
          let nextProgress = mv.progressPercent + 2;
          if (nextProgress > 100) {
            nextProgress = 0;
          }
          return { ...mv, progressPercent: nextProgress };
        }),
      );

      // Subtle reach stacker drift for lively animation
      this.equipment.update((eqs) =>
        eqs.map((e, idx) => {
          if (idx === 0) {
            const shift = Math.sin(Date.now() / 3500) * 1.5;
            return { ...e, xPercent: 52 + shift };
          }
          return e;
        }),
      );
    }, 400);
  }

  public toggleSimulation(): void {
    this.simulationActive.update((val) => !val);
  }

  public selectSlot(slot: ParkingSlot | null): void {
    this.selectedSlot.set(slot);
  }

  public updateSlotStatus(slotId: string, newStatus: ParkingSlotStatus): void {
    this._slots.update((slots) =>
      slots.map((s) => {
        if (s.id === slotId) {
          return {
            ...s,
            status: newStatus,
            truckNumber: newStatus === 'available' ? undefined : s.truckNumber,
            driverName: newStatus === 'available' ? undefined : s.driverName,
          };
        }
        return s;
      }),
    );

    const current = this.selectedSlot();
    if (current && current.id === slotId) {
      this.selectedSlot.set(this._slots().find((s) => s.id === slotId) || null);
    }
  }
}
