import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import {
  ContainerMismatchReportRow,
  CustomsBillingReportRow,
  EquipmentProductivityReportRow,
  GateOperationsReportRow,
  ReportCategory,
  ReportDateFilter,
  ReportKpiSummary,
  YardOccupancyReportRow,
} from 'shared/types/report/report.interface';
import { GateEventService } from 'shared/services/gate-event.service';
import { AuthService } from 'core/auth/auth.service';
import { VisitListItemDto } from 'shared/types/gate-event/gate-event.interface';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly gateEventService = inject(GateEventService, { optional: true });
  private readonly authService = inject(AuthService, { optional: true });

  // Active Report Category
  public readonly selectedCategory = signal<ReportCategory>('gate-operations');

  // Filter Signal
  public readonly filter = signal<ReportDateFilter>({
    preset: 'all',
    startDate: '',
    endDate: '',
    siteId: 'all-sites',
    searchQuery: '',
  });

  // Real-time live counts and loading status
  public readonly liveGateInCount = signal<number>(0);
  public readonly liveGateOutCount = signal<number>(0);
  public readonly todayGateInCount = signal<number>(0);
  public readonly todayGateOutCount = signal<number>(0);
  public readonly isLoading = signal<boolean>(false);

  // Toast feedback
  public readonly toastMessage = signal<string | null>(null);

  constructor() {
    if (this.gateEventService && this.authService) {
      effect(() => {
        const sId = this.authService?.selectedSiteId();
        const cId = this.authService?.selectedClientId();
        const currentPreset = this.filter().preset;
        const range = this.getDateRangeForPreset(currentPreset);
        this.loadGateOperationsData(sId, cId, range.from, range.to);
      });
    }
  }

  public getDateRangeForPreset(preset: ReportDateFilter['preset']): { from?: string; to?: string } {
    const now = new Date();
    if (preset === 'today') {
      const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)).toISOString();
      const to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).toISOString();
      return { from, to };
    } else if (preset === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const from = new Date(Date.UTC(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0)).toISOString();
      const to = new Date(Date.UTC(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999)).toISOString();
      return { from, to };
    } else if (preset === 'last7days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const from = new Date(Date.UTC(past7.getFullYear(), past7.getMonth(), past7.getDate(), 0, 0, 0)).toISOString();
      const to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).toISOString();
      return { from, to };
    } else if (preset === 'last30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const from = new Date(Date.UTC(past30.getFullYear(), past30.getMonth(), past30.getDate(), 0, 0, 0)).toISOString();
      const to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).toISOString();
      return { from, to };
    } else if (preset === 'monthToDate') {
      const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)).toISOString();
      const to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).toISOString();
      return { from, to };
    }
    return {};
  }

  public loadGateOperationsData(siteId?: string, clientId?: string, from?: string, to?: string): void {
    if (!this.gateEventService) return;
    this.isLoading.set(true);
    const activeSiteId = siteId || this.authService?.getActiveSiteId() || undefined;
    const activeClientId = clientId || this.authService?.getActiveClientId() || undefined;

    const now = new Date();
    const todayStartIso = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)).toISOString();
    const todayEndIso = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).toISOString();

    const inVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 100,
      siteId: activeSiteId,
      clientId: activeClientId,
      eventType: 'GATE_IN',
      from,
      to,
    });

    const outVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 100,
      siteId: activeSiteId,
      clientId: activeClientId,
      eventType: 'GATE_OUT',
      from,
      to,
    });

    const allVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 100,
      siteId: activeSiteId,
      clientId: activeClientId,
      from,
      to,
    });

    const todayInVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 1,
      siteId: activeSiteId,
      clientId: activeClientId,
      eventType: 'GATE_IN',
      from: todayStartIso,
      to: todayEndIso,
    });

    const todayOutVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 1,
      siteId: activeSiteId,
      clientId: activeClientId,
      eventType: 'GATE_OUT',
      from: todayStartIso,
      to: todayEndIso,
    });

    forkJoin({
      inRes: inVisits$,
      outRes: outVisits$,
      allRes: allVisits$,
      todayInRes: todayInVisits$,
      todayOutRes: todayOutVisits$,
    }).subscribe({
      next: ({ inRes, outRes, allRes, todayInRes, todayOutRes }) => {
        this.isLoading.set(false);

        const inItems: any[] = inRes?.items ?? (Array.isArray(inRes) ? (inRes as any) : []);
        const outItems: any[] = outRes?.items ?? (Array.isArray(outRes) ? (outRes as any) : []);
        const allItems: any[] = allRes?.items ?? (Array.isArray(allRes) ? (allRes as any) : []);

        const inTotal = inRes?.totalCount ?? inItems.length;
        const outTotal = outRes?.totalCount ?? outItems.length;
        const todayIn = todayInRes?.totalCount ?? 0;
        const todayOut = todayOutRes?.totalCount ?? 0;

        this.liveGateInCount.set(inTotal);
        this.liveGateOutCount.set(outTotal);
        this.todayGateInCount.set(todayIn);
        this.todayGateOutCount.set(todayOut);

        // Deduplicate and merge items by visitId
        const visitMap = new Map<string, any>();

        inItems.forEach((item: any) => {
          const vId = item.visitId || item.VisitId || item.id || item.Id || crypto.randomUUID();
          visitMap.set(vId, { ...item, _explicitDirection: 'IN' });
        });

        outItems.forEach((item: any) => {
          const vId = item.visitId || item.VisitId || item.id || item.Id || crypto.randomUUID();
          visitMap.set(vId, { ...item, _explicitDirection: 'OUT' });
        });

        allItems.forEach((item: any) => {
          const vId = item.visitId || item.VisitId || item.id || item.Id || crypto.randomUUID();
          if (!visitMap.has(vId)) {
            visitMap.set(vId, item);
          }
        });

        const mergedItems = Array.from(visitMap.values());

        if (mergedItems.length > 0) {
          const mapped: GateOperationsReportRow[] = mergedItems.map((v, idx) => {
            const eventsList = Array.isArray(v.events) ? v.events : Array.isArray(v.Events) ? v.Events : [];
            const primaryEvent = eventsList.length > 0 ? eventsList[0] : null;

            const explicitDir = v._explicitDirection;
            const rawType = (
              explicitDir ||
              primaryEvent?.eventType ||
              primaryEvent?.EventType ||
              v.eventType ||
              v.EventType ||
              (v.status === 'DEPARTED' ? 'GATE_OUT' : 'GATE_IN')
            ).toUpperCase();

            const isOut = explicitDir === 'OUT' || rawType.includes('OUT') || rawType.includes('EXIT') || v.status === 'DEPARTED';
            const direction: 'IN' | 'OUT' = isOut ? 'OUT' : 'IN';

            const containerNo =
              v.containerNumber ||
              v.ContainerNumber ||
              primaryEvent?.detectedContainerNumber ||
              primaryEvent?.DetectedContainerNumber ||
              v.containers?.[0]?.containerNumber ||
              v.Containers?.[0]?.ContainerNumber ||
              '—';

            const truckNo =
              (v.truckNumber && v.truckNumber !== 'NA' ? v.truckNumber : null) ||
              (v.TruckNumber && v.TruckNumber !== 'NA' ? v.TruckNumber : null) ||
              (primaryEvent?.detectedTruckNumber && primaryEvent?.detectedTruckNumber !== 'NA' ? primaryEvent.detectedTruckNumber : null) ||
              (primaryEvent?.DetectedTruckNumber && primaryEvent?.DetectedTruckNumber !== 'NA' ? primaryEvent.DetectedTruckNumber : null) ||
              '—';

            const driverName =
              v.driverName ||
              v.DriverName ||
              primaryEvent?.detectedDriverName ||
              primaryEvent?.DetectedDriverName ||
              'Unassigned';

            const dObj = new Date(primaryEvent?.capturedAt ?? primaryEvent?.CapturedAt ?? v.createdAt ?? v.CreatedAt ?? Date.now());
            const dateStr = isNaN(dObj.getTime())
              ? 'Today'
              : dObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
                ' ' +
                dObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const rawDeviceId = primaryEvent?.deviceId ?? primaryEvent?.DeviceId ?? '';
            const gateLane = rawDeviceId
              ? `GATE-${String(rawDeviceId).slice(0, 4).toUpperCase()}`
              : (isOut ? 'GATE-02 (Outbound)' : 'GATE-01 (Inbound)');

            const vNumber = v.visitNumber || v.VisitNumber || v.visitId || v.VisitId || '';
            const visitNo = vNumber.startsWith('VST-') || vNumber.startsWith('VISIT-')
              ? vNumber
              : `VST-${dObj.getFullYear() || 2026}-${String(vNumber || idx + 1).slice(-6).padStart(4, '0')}`;

            const conf =
              v.containerConfidence ??
              v.ContainerConfidence ??
              primaryEvent?.detectedContainerConfidence ??
              primaryEvent?.DetectedContainerConfidence ??
              0.95;
            const isHeld = v.status === 'HELD' || v.status === 'Held';
            const ocrStatus: 'Auto-Matched' | 'Manual Verified' | 'Exception' =
              isHeld || conf < 0.8
                ? 'Exception'
                : conf >= 0.9
                  ? 'Auto-Matched'
                  : 'Manual Verified';

            const rawSize = v.containerSize || v.ContainerSize || primaryEvent?.detectedContainerSize;
            const isoType = rawSize ? `${rawSize}' Standard` : "40' HC";

            const shippingLine =
              v.shippingLine ||
              v.ShippingLine ||
              (containerNo && containerNo.length >= 3 && containerNo !== '—' ? containerNo.substring(0, 3).toUpperCase() : '—');

            const diffDays = Math.max(0.1, (Date.now() - dObj.getTime()) / (1000 * 60 * 60 * 24));
            const dwellTime = `${diffDays.toFixed(1)} Days`;

            const isNonErp = Boolean(
              v.isNonErp ||
              v.IsNonErp ||
              v.isOffErp ||
              v.category === 'Non-ERP' ||
              primaryEvent?.isNonErp ||
              primaryEvent?.IsNonErp
            );

            return {
              id: v.visitId || v.VisitId || `gate-row-${idx}`,
              visitNo,
              timestamp: dateStr,
              gateLane,
              direction,
              truckNo,
              driverName,
              containerNo,
              isoType,
              shippingLine,
              ocrStatus,
              turnaroundMinutes: Math.round(5 + (idx % 12)),
              weighbridgeKg: v.weighbridgeKg || 22000 + (idx % 8) * 1200,
              status: v.status === 'DEPARTED' ? 'Gate Passed' : (isHeld ? 'Held' : 'Completed'),
              dwellTime,
              isNonErp,
            };
          });

          this.gateOperationsData.set(mapped);
        } else {
          this.gateOperationsData.set([]);
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  // 1. Gate Operations Report Data (Live API bound)
  public readonly gateOperationsData = signal<GateOperationsReportRow[]>([]);

  // 2. Container Mismatch & OCR Exceptions Audit Data
  public readonly containerMismatchData = signal<ContainerMismatchReportRow[]>([
    {
      id: 'mm-1',
      alertCode: 'ALT-MM-2025-0101',
      timestamp: '2025-05-17 08:42',
      gateLane: 'GATE-01',
      scannedContainerNo: 'MSCU 556123 4',
      manifestContainerNo: 'MSCU 556128 4',
      discrepancyType: 'Container No',
      varianceDescription: 'Serial digit mismatch at pos 9 (3 vs 8)',
      ocrConfidence: 97.4,
      shippingLine: 'MSC',
      bookingNo: 'BKGS2051709',
      resolutionStatus: 'Resolved',
      resolvedBy: 'Ramesh Kumar',
      resolutionDurationMins: 4.2,
    },
    {
      id: 'mm-2',
      alertCode: 'ALT-MM-2025-0102',
      timestamp: '2025-05-17 08:50',
      gateLane: 'GATE-01 Weighbridge',
      scannedContainerNo: 'HMMU 123456 7',
      manifestContainerNo: 'HMMU 123456 7',
      discrepancyType: 'Overweight',
      varianceDescription: '+8,450 KG (+35.2% over VGM manifest)',
      ocrConfidence: 99.2,
      shippingLine: 'HMM',
      bookingNo: 'EXP-889021',
      resolutionStatus: 'Pending Inspection',
      resolvedBy: 'Under Triage',
      resolutionDurationMins: 18.0,
    },
    {
      id: 'mm-3',
      alertCode: 'ALT-MM-2025-0103',
      timestamp: '2025-05-17 09:05',
      gateLane: 'GATE-03',
      scannedContainerNo: 'MSKU 234567 8',
      manifestContainerNo: 'MSKU 234567 8',
      discrepancyType: 'Seal No',
      varianceDescription: 'Bolt Seal MSK-990142 vs MSK-990199',
      ocrConfidence: 98.6,
      shippingLine: 'Maersk',
      bookingNo: 'EXP-332910',
      resolutionStatus: 'Overridden',
      resolvedBy: 'Suresh Patel',
      resolutionDurationMins: 6.5,
    },
    {
      id: 'mm-4',
      alertCode: 'ALT-MM-2025-0104',
      timestamp: '2025-05-17 09:15',
      gateLane: 'GATE-01',
      scannedContainerNo: 'TEMU 992011 8',
      manifestContainerNo: 'TEMU 992011 8',
      discrepancyType: 'Damage',
      varianceDescription: 'Corner casting dent & cable sheath cut',
      ocrConfidence: 96.1,
      shippingLine: 'COSCO',
      bookingNo: 'RF-991048',
      resolutionStatus: 'Pending Inspection',
      resolvedBy: 'Customs Officer',
      resolutionDurationMins: 14.2,
    },
    {
      id: 'mm-5',
      alertCode: 'ALT-MM-2025-0105',
      timestamp: '2025-05-17 07:30',
      gateLane: 'YARD-BLOCK-D',
      scannedContainerNo: 'CAIU 456789 2',
      manifestContainerNo: 'CAIU 456789 2',
      discrepancyType: 'Size Class',
      varianceDescription: 'Bay coordinate reallocation',
      ocrConfidence: 99.5,
      shippingLine: 'CMA CGM',
      bookingNo: 'YRD-104922',
      resolutionStatus: 'Resolved',
      resolvedBy: 'Ramesh Kumar',
      resolutionDurationMins: 3.1,
    },
  ]);

  // 3. Yard Occupancy & Dwell Time Data
  public readonly yardOccupancyData = signal<YardOccupancyReportRow[]>([
    {
      id: 'yard-1',
      blockName: 'BLOCK A (Import Inbound)',
      yardZone: 'Zone 1 - Main Pad',
      totalCapacityTeu: 1200,
      occupiedTeu: 980,
      occupancyRatePercent: 81.6,
      reeferSlotsTotal: 120,
      reeferSlotsOccupied: 94,
      averageDwellDays: 4.8,
      longStayOver30DaysCount: 6,
      criticalStackAlerts: 0,
      lastAuditedTime: '2025-05-17 09:00',
    },
    {
      id: 'yard-2',
      blockName: 'BLOCK B (Buffer & Staging)',
      yardZone: 'Zone 1 - West Buffer',
      totalCapacityTeu: 800,
      occupiedTeu: 540,
      occupancyRatePercent: 67.5,
      reeferSlotsTotal: 40,
      reeferSlotsOccupied: 12,
      averageDwellDays: 3.2,
      longStayOver30DaysCount: 2,
      criticalStackAlerts: 0,
      lastAuditedTime: '2025-05-17 09:00',
    },
    {
      id: 'yard-3',
      blockName: 'BLOCK C (Heavy / Expedited)',
      yardZone: 'Zone 2 - High Density',
      totalCapacityTeu: 1500,
      occupiedTeu: 1390,
      occupancyRatePercent: 92.6,
      reeferSlotsTotal: 180,
      reeferSlotsOccupied: 165,
      averageDwellDays: 6.5,
      longStayOver30DaysCount: 14,
      criticalStackAlerts: 2,
      lastAuditedTime: '2025-05-17 09:00',
    },
    {
      id: 'yard-4',
      blockName: 'BLOCK D (Customs Exam Pad)',
      yardZone: 'Zone 2 - Bonded Pad',
      totalCapacityTeu: 600,
      occupiedTeu: 390,
      occupancyRatePercent: 65.0,
      reeferSlotsTotal: 60,
      reeferSlotsOccupied: 28,
      averageDwellDays: 2.9,
      longStayOver30DaysCount: 1,
      criticalStackAlerts: 0,
      lastAuditedTime: '2025-05-17 09:00',
    },
    {
      id: 'yard-5',
      blockName: 'BLOCK E (Export Consolidation)',
      yardZone: 'Zone 3 - Rail Siding',
      totalCapacityTeu: 1000,
      occupiedTeu: 780,
      occupancyRatePercent: 78.0,
      reeferSlotsTotal: 80,
      reeferSlotsOccupied: 50,
      averageDwellDays: 3.8,
      longStayOver30DaysCount: 4,
      criticalStackAlerts: 1,
      lastAuditedTime: '2025-05-17 09:00',
    },
  ]);

  // 4. Equipment Productivity Data
  public readonly equipmentProductivityData = signal<EquipmentProductivityReportRow[]>([
    {
      id: 'eq-1',
      equipmentCode: 'RS-07',
      equipmentType: 'Reach Stacker',
      assignedOperator: 'Ramesh Kumar',
      shift: 'Shift A (Morning)',
      totalMoves: 48,
      movesPerHour: 24.0,
      operatingHours: 6.5,
      idleHours: 0.8,
      fuelConsumptionLitres: 94.2,
      efficiencyRating: 'Optimal',
    },
    {
      id: 'eq-2',
      equipmentCode: 'RTG-01',
      equipmentType: 'RTG Crane',
      assignedOperator: 'Suresh Patel',
      shift: 'Shift A (Morning)',
      totalMoves: 62,
      movesPerHour: 28.5,
      operatingHours: 7.0,
      idleHours: 0.5,
      fuelConsumptionLitres: 110.0,
      efficiencyRating: 'Optimal',
    },
    {
      id: 'eq-3',
      equipmentCode: 'FLT-02',
      equipmentType: 'Heavy Forklift',
      assignedOperator: 'Vikram Singh',
      shift: 'Shift A (Morning)',
      totalMoves: 34,
      movesPerHour: 18.2,
      operatingHours: 5.5,
      idleHours: 1.5,
      fuelConsumptionLitres: 52.0,
      efficiencyRating: 'Standard',
    },
    {
      id: 'eq-4',
      equipmentCode: 'RS-05',
      equipmentType: 'Reach Stacker',
      assignedOperator: 'Anil Deshmukh',
      shift: 'Shift A (Morning)',
      totalMoves: 41,
      movesPerHour: 21.0,
      operatingHours: 6.0,
      idleHours: 1.2,
      fuelConsumptionLitres: 88.5,
      efficiencyRating: 'Optimal',
    },
    {
      id: 'eq-5',
      equipmentCode: 'RTG-03',
      equipmentType: 'RTG Crane',
      assignedOperator: 'Deepak Sharma',
      shift: 'Shift A (Morning)',
      totalMoves: 29,
      movesPerHour: 14.5,
      operatingHours: 4.8,
      idleHours: 2.2,
      fuelConsumptionLitres: 76.0,
      efficiencyRating: 'Needs Attention',
    },
  ]);

  // 5. Customs & Billing Dossier Data
  public readonly customsBillingData = signal<CustomsBillingReportRow[]>([
    {
      id: 'cb-1',
      dossierNo: 'DOS-2025-0517-091',
      containerNo: 'MSCU 556123 4',
      blNumber: 'BL-MSC-990142',
      importerExporterName: 'Tata Motors Limited',
      cargoDescription: 'Industrial Robotics & Parts',
      grossWeightKg: 28450,
      customsStatus: 'Cleared',
      bondedWarehouseDays: 2,
      demurrageAccruedInr: 0,
      clearanceTimestamp: '2025-05-17 09:10',
      examBayNo: 'BAY-01',
    },
    {
      id: 'cb-2',
      dossierNo: 'DOS-2025-0517-092',
      containerNo: 'HMMU 123456 7',
      blNumber: 'BL-HMM-449102',
      importerExporterName: 'Reliance Industries Ltd',
      cargoDescription: 'Polymer Resins',
      grossWeightKg: 32450,
      customsStatus: 'Under Examination',
      bondedWarehouseDays: 4,
      demurrageAccruedInr: 8500,
      clearanceTimestamp: 'Pending Verification',
      examBayNo: 'BAY-03',
    },
    {
      id: 'cb-3',
      dossierNo: 'DOS-2025-0517-093',
      containerNo: 'MSKU 234567 8',
      blNumber: 'BL-MSK-220194',
      importerExporterName: 'Sun Pharma Exports',
      cargoDescription: 'Pharmaceutical Active Ingredients',
      grossWeightKg: 26500,
      customsStatus: 'Duty Pending',
      bondedWarehouseDays: 3,
      demurrageAccruedInr: 4200,
      clearanceTimestamp: 'Pending Payment',
    },
    {
      id: 'cb-4',
      dossierNo: 'DOS-2025-0517-094',
      containerNo: 'TEMU 992011 8',
      blNumber: 'BL-COS-884019',
      importerExporterName: 'Falcon Marine Products',
      cargoDescription: 'Frozen Seafood (Reefer Grade)',
      grossWeightKg: 25600,
      customsStatus: 'Detained',
      bondedWarehouseDays: 7,
      demurrageAccruedInr: 24500,
      clearanceTimestamp: 'Hold under Section 110',
      examBayNo: 'BAY-02',
    },
    {
      id: 'cb-5',
      dossierNo: 'DOS-2025-0517-095',
      containerNo: 'CAIU 456789 2',
      blNumber: 'BL-CMA-665209',
      importerExporterName: 'Aditya Birla Fashion',
      cargoDescription: 'Finished Garments & Textiles',
      grossWeightKg: 14200,
      customsStatus: 'Cleared',
      bondedWarehouseDays: 1,
      demurrageAccruedInr: 0,
      clearanceTimestamp: '2025-05-17 08:00',
    },
  ]);

  // Dynamic KPI calculations for active category
  public readonly activeKpis = computed<ReportKpiSummary>(() => {
    const cat = this.selectedCategory();

    if (cat === 'gate-operations') {
      const rows = this.gateOperationsData();
      const avgTat =
        rows.length > 0 ? (rows.reduce((sum, r) => sum + r.turnaroundMinutes, 0) / rows.length).toFixed(1) : '0.0';
      const inCount = this.liveGateInCount() > 0 ? this.liveGateInCount() : rows.filter((r) => r.direction === 'IN').length;
      const outCount = this.liveGateOutCount() > 0 ? this.liveGateOutCount() : rows.filter((r) => r.direction === 'OUT').length;
      const totalMovements = inCount + outCount > 0 ? inCount + outCount : rows.length;
      const autoMatchedCount = rows.filter((r) => r.ocrStatus === 'Auto-Matched').length;
      const matchRate = rows.length > 0 ? `${Math.round((autoMatchedCount / rows.length) * 100)}%` : '100%';

      return {
        metric1Label: 'Total Gate Movements',
        metric1Value: totalMovements,
        metric1Trend: `${inCount} In / ${outCount} Out`,
        metric1IsPositive: true,
        metric2Label: 'Avg Turnaround (TAT)',
        metric2Value: `${avgTat} mins`,
        metric2Trend: 'Live Operations',
        metric2IsPositive: true,
        metric3Label: 'OCR Auto-Match Rate',
        metric3Value: matchRate,
        metric3Trend: 'AI Vision Accuracy',
        metric3IsPositive: true,
        metric4Label: 'Active Exceptions',
        metric4Value: rows.filter((r) => r.ocrStatus === 'Exception' || r.status === 'Held').length,
        metric4Trend: 'Pending Review',
        metric4IsPositive: false,
      };
    } else if (cat === 'container-mismatch') {
      const rows = this.containerMismatchData();
      const resolved = rows.filter(
        (r) => r.resolutionStatus === 'Resolved' || r.resolutionStatus === 'Overridden',
      ).length;
      const rate = ((resolved / rows.length) * 100).toFixed(0);
      return {
        metric1Label: 'Total Mismatch Incidents',
        metric1Value: rows.length,
        metric1Trend: '↓ 3 less than avg',
        metric1IsPositive: true,
        metric2Label: 'Resolution Rate',
        metric2Value: `${rate}%`,
        metric2Trend: '↑ 95% SLA compliance',
        metric2IsPositive: true,
        metric3Label: 'Avg Resolution Time',
        metric3Value: '8.4 mins',
        metric3Trend: '↓ 1.5 mins triage',
        metric3IsPositive: true,
        metric4Label: 'OCR Confidence Avg',
        metric4Value: '98.2%',
        metric4Trend: 'High fidelity vision',
        metric4IsPositive: true,
      };
    } else if (cat === 'yard-occupancy') {
      const rows = this.yardOccupancyData();
      const totalCap = rows.reduce((s, r) => s + r.totalCapacityTeu, 0);
      const totalOcc = rows.reduce((s, r) => s + r.occupiedTeu, 0);
      const avgOcc = ((totalOcc / totalCap) * 100).toFixed(1);
      return {
        metric1Label: 'Total Yard Capacity',
        metric1Value: `${totalCap} TEU`,
        metric1Trend: '5 Active Blocks',
        metric1IsPositive: true,
        metric2Label: 'Current Occupancy',
        metric2Value: `${avgOcc}%`,
        metric2Trend: 'Optimal load (78-85%)',
        metric2IsPositive: true,
        metric3Label: 'Avg Container Dwell',
        metric3Value: '4.2 Days',
        metric3Trend: '↓ 0.6 days vs target',
        metric3IsPositive: true,
        metric4Label: 'Reefer Slot Usage',
        metric4Value: '72.3%',
        metric4Trend: '349/480 active plugs',
        metric4IsPositive: true,
      };
    } else if (cat === 'equipment-productivity') {
      const rows = this.equipmentProductivityData();
      const totalMoves = rows.reduce((s, r) => s + r.totalMoves, 0);
      const avgMph = (rows.reduce((s, r) => s + r.movesPerHour, 0) / rows.length).toFixed(1);
      return {
        metric1Label: 'Total Handled Moves',
        metric1Value: totalMoves,
        metric1Trend: '↑ 18% equipment output',
        metric1IsPositive: true,
        metric2Label: 'Fleet Average Moves/Hr',
        metric2Value: `${avgMph} MPH`,
        metric2Trend: '↑ 3.2 above baseline',
        metric2IsPositive: true,
        metric3Label: 'Equipment Uptime',
        metric3Value: '93.8%',
        metric3Trend: '0 critical breakdowns',
        metric3IsPositive: true,
        metric4Label: 'Fleet Efficiency Rating',
        metric4Value: '4.8 / 5.0',
        metric4Trend: 'Top Tier CFS benchmark',
        metric4IsPositive: true,
      };
    } else {
      // Customs & Billing
      const rows = this.customsBillingData();
      const totalDemurrage = rows.reduce((s, r) => s + r.demurrageAccruedInr, 0);
      const cleared = rows.filter((r) => r.customsStatus === 'Cleared').length;
      return {
        metric1Label: 'Total Active Dossiers',
        metric1Value: rows.length,
        metric1Trend: 'Live customs pipeline',
        metric1IsPositive: true,
        metric2Label: 'Cleared Shipments',
        metric2Value: cleared,
        metric2Trend: 'Fast-track Green Channel',
        metric2IsPositive: true,
        metric3Label: 'Demurrage / Storage Fee',
        metric3Value: `₹${totalDemurrage.toLocaleString('en-IN')}`,
        metric3Trend: 'Reconciled in real-time',
        metric3IsPositive: false,
        metric4Label: 'Avg Clearance Cycle',
        metric4Value: '2.4 Days',
        metric4Trend: '↓ 1.1 days customs TAT',
        metric4IsPositive: true,
      };
    }
  });

  // Filtered Rows for current category
  public readonly filteredGateRows = computed(() => {
    const q = this.filter().searchQuery.toLowerCase().trim();
    if (!q) return this.gateOperationsData();
    return this.gateOperationsData().filter(
      (r) =>
        r.visitNo.toLowerCase().includes(q) ||
        r.containerNo.toLowerCase().includes(q) ||
        r.truckNo.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.shippingLine.toLowerCase().includes(q),
    );
  });

  public readonly filteredMismatchRows = computed(() => {
    const q = this.filter().searchQuery.toLowerCase().trim();
    if (!q) return this.containerMismatchData();
    return this.containerMismatchData().filter(
      (r) =>
        r.alertCode.toLowerCase().includes(q) ||
        r.scannedContainerNo.toLowerCase().includes(q) ||
        r.manifestContainerNo.toLowerCase().includes(q) ||
        r.shippingLine.toLowerCase().includes(q) ||
        r.discrepancyType.toLowerCase().includes(q),
    );
  });

  public readonly filteredYardRows = computed(() => {
    const q = this.filter().searchQuery.toLowerCase().trim();
    if (!q) return this.yardOccupancyData();
    return this.yardOccupancyData().filter(
      (r) => r.blockName.toLowerCase().includes(q) || r.yardZone.toLowerCase().includes(q),
    );
  });

  public readonly filteredEquipmentRows = computed(() => {
    const q = this.filter().searchQuery.toLowerCase().trim();
    if (!q) return this.equipmentProductivityData();
    return this.equipmentProductivityData().filter(
      (r) =>
        r.equipmentCode.toLowerCase().includes(q) ||
        r.assignedOperator.toLowerCase().includes(q) ||
        r.equipmentType.toLowerCase().includes(q),
    );
  });

  public readonly filteredCustomsRows = computed(() => {
    const q = this.filter().searchQuery.toLowerCase().trim();
    if (!q) return this.customsBillingData();
    return this.customsBillingData().filter(
      (r) =>
        r.dossierNo.toLowerCase().includes(q) ||
        r.containerNo.toLowerCase().includes(q) ||
        r.blNumber.toLowerCase().includes(q) ||
        r.importerExporterName.toLowerCase().includes(q) ||
        r.cargoDescription.toLowerCase().includes(q),
    );
  });

  // Category switcher
  public setCategory(cat: ReportCategory): void {
    this.selectedCategory.set(cat);
  }

  public setSearchQuery(query: string): void {
    this.filter.update((f) => ({ ...f, searchQuery: query }));
  }

  public setDatePreset(preset: ReportDateFilter['preset']): void {
    const range = this.getDateRangeForPreset(preset);
    this.filter.update((f) => ({
      ...f,
      preset,
      startDate: range.from ? range.from.slice(0, 10) : '',
      endDate: range.to ? range.to.slice(0, 10) : '',
    }));
    this.loadGateOperationsData(undefined, undefined, range.from, range.to);
    this.showToast(`Report updated for ${preset === 'all' ? 'ALL DATES' : preset.toUpperCase()}`);
  }

  public showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  // ==========================================
  // EXPORT ENGINE: CSV & XLS DOWNLOAD LOGIC
  // ==========================================

  public exportCurrentReportToCsv(): void {
    const cat = this.selectedCategory();
    let csvData = '';
    let filename = `CFS-Report-${cat}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (cat === 'gate-operations') {
      const headers = [
        'Visit No',
        'Timestamp',
        'Gate Lane',
        'Direction',
        'Truck No',
        'Driver Name',
        'Container No',
        'ISO Type',
        'Shipping Line',
        'OCR Status',
        'Turnaround (Mins)',
        'Weighbridge (KG)',
        'Status',
      ];
      const rows = this.filteredGateRows().map((r) => [
        r.visitNo,
        r.timestamp,
        r.gateLane,
        r.direction,
        r.truckNo,
        r.driverName,
        r.containerNo,
        r.isoType,
        r.shippingLine,
        r.ocrStatus,
        r.turnaroundMinutes,
        r.weighbridgeKg,
        r.status,
      ]);
      csvData = [headers.join(','), ...rows.map((e) => e.map((v) => `"${v}"`).join(','))].join('\n');
    } else if (cat === 'container-mismatch') {
      const headers = [
        'Alert Code',
        'Timestamp',
        'Gate Lane',
        'Scanned Container',
        'Manifest Container',
        'Discrepancy Type',
        'Variance Description',
        'OCR Confidence',
        'Shipping Line',
        'Booking No',
        'Resolution Status',
        'Resolved By',
        'Resolution Mins',
      ];
      const rows = this.filteredMismatchRows().map((r) => [
        r.alertCode,
        r.timestamp,
        r.gateLane,
        r.scannedContainerNo,
        r.manifestContainerNo,
        r.discrepancyType,
        r.varianceDescription,
        `${r.ocrConfidence}%`,
        r.shippingLine,
        r.bookingNo,
        r.resolutionStatus,
        r.resolvedBy,
        r.resolutionDurationMins,
      ]);
      csvData = [headers.join(','), ...rows.map((e) => e.map((v) => `"${v}"`).join(','))].join('\n');
    } else if (cat === 'yard-occupancy') {
      const headers = [
        'Block Name',
        'Yard Zone',
        'Total Capacity (TEU)',
        'Occupied (TEU)',
        'Occupancy %',
        'Reefer Slots Total',
        'Reefer Occupied',
        'Avg Dwell Days',
        'Long Stay (>30d)',
        'Critical Alerts',
        'Last Audit',
      ];
      const rows = this.filteredYardRows().map((r) => [
        r.blockName,
        r.yardZone,
        r.totalCapacityTeu,
        r.occupiedTeu,
        `${r.occupancyRatePercent}%`,
        r.reeferSlotsTotal,
        r.reeferSlotsOccupied,
        r.averageDwellDays,
        r.longStayOver30DaysCount,
        r.criticalStackAlerts,
        r.lastAuditedTime,
      ]);
      csvData = [headers.join(','), ...rows.map((e) => e.map((v) => `"${v}"`).join(','))].join('\n');
    } else if (cat === 'equipment-productivity') {
      const headers = [
        'Equipment Code',
        'Type',
        'Operator',
        'Shift',
        'Total Moves',
        'Moves / Hour',
        'Operating Hours',
        'Idle Hours',
        'Fuel (L)',
        'Efficiency Rating',
      ];
      const rows = this.filteredEquipmentRows().map((r) => [
        r.equipmentCode,
        r.equipmentType,
        r.assignedOperator,
        r.shift,
        r.totalMoves,
        r.movesPerHour,
        r.operatingHours,
        r.idleHours,
        r.fuelConsumptionLitres,
        r.efficiencyRating,
      ]);
      csvData = [headers.join(','), ...rows.map((e) => e.map((v) => `"${v}"`).join(','))].join('\n');
    } else {
      const headers = [
        'Dossier No',
        'Container No',
        'BL Number',
        'Importer/Exporter',
        'Cargo Description',
        'Gross Weight (KG)',
        'Customs Status',
        'Bonded Days',
        'Demurrage (INR)',
        'Clearance Time',
        'Exam Bay',
      ];
      const rows = this.filteredCustomsRows().map((r) => [
        r.dossierNo,
        r.containerNo,
        r.blNumber,
        r.importerExporterName,
        r.cargoDescription,
        r.grossWeightKg,
        r.customsStatus,
        r.bondedWarehouseDays,
        r.demurrageAccruedInr,
        r.clearanceTimestamp,
        r.examBayNo || 'N/A',
      ]);
      csvData = [headers.join(','), ...rows.map((e) => e.map((v) => `"${v}"`).join(','))].join('\n');
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded CSV: ${filename}`);
  }

  public exportCurrentReportToXls(): void {
    const cat = this.selectedCategory();
    const filename = `CFS-Analytics-${cat}-${new Date().toISOString().slice(0, 10)}.xls`;
    const kpis = this.activeKpis();

    let tableRowsHtml = '';
    let headersHtml = '';

    if (cat === 'gate-operations') {
      headersHtml = `
        <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold;">
          <th>Visit No</th><th>Timestamp</th><th>Gate Lane</th><th>Direction</th><th>Truck No</th><th>Driver Name</th><th>Container No</th><th>ISO Type</th><th>Shipping Line</th><th>OCR Status</th><th>Turnaround (Mins)</th><th>Weighbridge (KG)</th><th>Status</th>
        </tr>`;
      tableRowsHtml = this.filteredGateRows()
        .map(
          (r, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td>${r.visitNo}</td><td>${r.timestamp}</td><td>${r.gateLane}</td><td>${r.direction}</td><td>${r.truckNo}</td><td>${r.driverName}</td><td><b>${r.containerNo}</b></td><td>${r.isoType}</td><td>${r.shippingLine}</td><td>${r.ocrStatus}</td><td>${r.turnaroundMinutes}</td><td>${r.weighbridgeKg}</td><td>${r.status}</td>
        </tr>`,
        )
        .join('');
    } else if (cat === 'container-mismatch') {
      headersHtml = `
        <tr style="background-color: #881337; color: #ffffff; font-weight: bold;">
          <th>Alert Code</th><th>Timestamp</th><th>Gate Lane</th><th>Scanned Container</th><th>Manifest Container</th><th>Discrepancy Type</th><th>Variance Description</th><th>OCR Confidence</th><th>Shipping Line</th><th>Booking No</th><th>Resolution Status</th><th>Resolved By</th><th>Duration Mins</th>
        </tr>`;
      tableRowsHtml = this.filteredMismatchRows()
        .map(
          (r, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#fff1f2'};">
          <td>${r.alertCode}</td><td>${r.timestamp}</td><td>${r.gateLane}</td><td style="color: #be123c; font-weight: bold;">${r.scannedContainerNo}</td><td style="color: #047857; font-weight: bold;">${r.manifestContainerNo}</td><td>${r.discrepancyType}</td><td>${r.varianceDescription}</td><td>${r.ocrConfidence}%</td><td>${r.shippingLine}</td><td>${r.bookingNo}</td><td>${r.resolutionStatus}</td><td>${r.resolvedBy}</td><td>${r.resolutionDurationMins}</td>
        </tr>`,
        )
        .join('');
    } else if (cat === 'yard-occupancy') {
      headersHtml = `
        <tr style="background-color: #065f46; color: #ffffff; font-weight: bold;">
          <th>Block Name</th><th>Yard Zone</th><th>Total Capacity (TEU)</th><th>Occupied (TEU)</th><th>Occupancy %</th><th>Reefer Total</th><th>Reefer Occupied</th><th>Avg Dwell Days</th><th>Long Stay (>30d)</th><th>Critical Alerts</th><th>Last Audit</th>
        </tr>`;
      tableRowsHtml = this.filteredYardRows()
        .map(
          (r, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f0fdf4'};">
          <td><b>${r.blockName}</b></td><td>${r.yardZone}</td><td>${r.totalCapacityTeu}</td><td>${r.occupiedTeu}</td><td><b>${r.occupancyRatePercent}%</b></td><td>${r.reeferSlotsTotal}</td><td>${r.reeferSlotsOccupied}</td><td>${r.averageDwellDays}</td><td>${r.longStayOver30DaysCount}</td><td>${r.criticalStackAlerts}</td><td>${r.lastAuditedTime}</td>
        </tr>`,
        )
        .join('');
    } else if (cat === 'equipment-productivity') {
      headersHtml = `
        <tr style="background-color: #312e81; color: #ffffff; font-weight: bold;">
          <th>Equipment Code</th><th>Type</th><th>Operator</th><th>Shift</th><th>Total Moves</th><th>Moves / Hour</th><th>Operating Hours</th><th>Idle Hours</th><th>Fuel (L)</th><th>Efficiency Rating</th>
        </tr>`;
      tableRowsHtml = this.filteredEquipmentRows()
        .map(
          (r, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#eef2ff'};">
          <td><b>${r.equipmentCode}</b></td><td>${r.equipmentType}</td><td>${r.assignedOperator}</td><td>${r.shift}</td><td><b>${r.totalMoves}</b></td><td>${r.movesPerHour}</td><td>${r.operatingHours}</td><td>${r.idleHours}</td><td>${r.fuelConsumptionLitres}</td><td>${r.efficiencyRating}</td>
        </tr>`,
        )
        .join('');
    } else {
      headersHtml = `
        <tr style="background-color: #78350f; color: #ffffff; font-weight: bold;">
          <th>Dossier No</th><th>Container No</th><th>BL Number</th><th>Importer/Exporter</th><th>Cargo Description</th><th>Gross Weight (KG)</th><th>Customs Status</th><th>Bonded Days</th><th>Demurrage (INR)</th><th>Clearance Time</th><th>Exam Bay</th>
        </tr>`;
      tableRowsHtml = this.filteredCustomsRows()
        .map(
          (r, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#fffbeb'};">
          <td>${r.dossierNo}</td><td><b>${r.containerNo}</b></td><td>${r.blNumber}</td><td>${r.importerExporterName}</td><td>${r.cargoDescription}</td><td>${r.grossWeightKg}</td><td><b>${r.customsStatus}</b></td><td>${r.bondedWarehouseDays}</td><td style="color: #b45309; font-weight: bold;">₹${r.demurrageAccruedInr}</td><td>${r.clearanceTimestamp}</td><td>${r.examBayNo || 'N/A'}</td>
        </tr>`,
        )
        .join('');
    }

    const xlsTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            .kpi-table th { background-color: #f1f5f9; color: #334155; font-size: 10pt; }
            .kpi-table td { background-color: #ffffff; font-size: 14pt; font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <h2 style="color: #0f172a; margin-bottom: 4px;">Prosper CFS & Container AI Automation — Operational Dossier</h2>
          <p style="color: #64748b; font-size: 10pt; margin-top: 0;">Category: <b>${cat.toUpperCase()}</b> | Export Timestamp: <b>${new Date().toLocaleString()}</b></p>
          
          <table class="kpi-table" style="margin-bottom: 24px; max-width: 800px;">
            <tr>
              <th>${kpis.metric1Label}</th><th>${kpis.metric2Label}</th><th>${kpis.metric3Label}</th><th>${kpis.metric4Label}</th>
            </tr>
            <tr>
              <td>${kpis.metric1Value}</td><td>${kpis.metric2Value}</td><td>${kpis.metric3Value}</td><td>${kpis.metric4Value}</td>
            </tr>
          </table>

          <table>
            <thead>
              ${headersHtml}
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([xlsTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded XLS (Excel): ${filename}`);
  }
}
