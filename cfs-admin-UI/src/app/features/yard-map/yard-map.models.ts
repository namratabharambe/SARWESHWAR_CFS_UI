export type ParkingSlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'incoming';
export type YardZoneType =
  | 'truck-parking'
  | 'reefer-parking'
  | 'stacking-import'
  | 'stacking-export'
  | 'empty-depot'
  | 'inspection-bay'
  | 'weighbridge'
  | 'gate-lane';

export type CargoCategory = 'Dry' | 'Reefer' | 'Hazardous' | 'Over-Dimensional' | 'Empty';

export interface GpsPoint {
  lat: number;
  lng: number;
}

export interface ParkingSlot {
  id: string;
  code: string;
  name: string;
  block?: string;
  row?: string;
  bay?: string;
  zone: YardZoneType;
  zoneLabel: string;
  status: ParkingSlotStatus;
  xPercent: number; // Position percentage on 2D/Satellite Yard canvas (0-100)
  yPercent: number;
  widthPercent?: number;
  heightPercent?: number;
  lat: number;
  lng: number;
  polygonPoints?: GpsPoint[];
  svgPoints?: string; // Precomputed SVG polygon points "x1,y1 x2,y2..."
  truckNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transporter?: string;
  containerNumber?: string;
  isoCode?: string; // e.g. 40HC, 20GP, 45R1
  shippingLine?: string; // Maersk, MSC, CMA CGM, Hapag-Lloyd, ONE, Evergreen
  cargoType?: CargoCategory;
  temperature?: string;
  sealNumber?: string;
  grossWeightKg?: number;
  dwellTime?: string;
  entryTime?: string;
  destination?: string;
  assignedTask?: string;
  cycle?: string;
  tierLevel?: number; // 1-4 for stacking bays
  maxTiers?: number;
  priority?: boolean;
}

export interface YardZoneSummary {
  id: YardZoneType;
  name: string;
  shortCode: string;
  badgeColor: string;
  bgRgba: string;
  borderColor: string;
  totalSlots: number;
  occupiedSlots: number;
  utilization: number;
}

export interface YardEquipmentItem {
  id: string;
  name: string;
  type: 'Reach Stacker' | 'Heavy Forklift' | 'Terminal Tractor' | 'Mobile Crane';
  operator: string;
  status: 'active' | 'idle' | 'maintenance';
  currentLocation: string;
  taskDescription: string;
  xPercent: number;
  yPercent: number;
  headingDeg: number;
}

export interface MovingVehicle {
  id: string;
  truckNumber: string;
  containerNumber: string;
  driverName: string;
  source: string;
  target: string;
  progressPercent: number;
  statusText: string;
  type: 'ENTRY_TO_BAY' | 'BAY_TO_EXIT' | 'INTERNAL_SHUFFLE';
}

export interface YardMapTelemetry {
  totalParkingBays: number;
  occupiedParkingBays: number;
  parkingUtilization: number;
  totalContainerSlots: number;
  occupiedContainerSlots: number;
  teuCapacity: number;
  currentTeu: number;
  liveTrucksInYard: number;
  avgTurnaroundMinutes: number;
  activeEquipment: number;
  reeferActiveCount: number;
  gateLanesActive: number;
}
