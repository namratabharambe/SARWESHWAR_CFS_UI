export type ReportCategory =
  'gate-operations' | 'container-mismatch' | 'yard-occupancy' | 'equipment-productivity' | 'customs-billing';

export interface ReportDateFilter {
  preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'monthToDate' | 'custom';
  startDate: string;
  endDate: string;
  siteId: string;
  searchQuery: string;
}

export interface GateOperationsReportRow {
  id: string;
  visitNo: string;
  timestamp: string;
  gateLane: string;
  direction: 'IN' | 'OUT';
  truckNo: string;
  driverName: string;
  containerNo: string;
  isoType: string;
  shippingLine: string;
  ocrStatus: 'Auto-Matched' | 'Manual Verified' | 'Exception';
  turnaroundMinutes: number;
  weighbridgeKg: number;
  status: 'Completed' | 'Gate Passed' | 'Held';
}

export interface ContainerMismatchReportRow {
  id: string;
  alertCode: string;
  timestamp: string;
  gateLane: string;
  scannedContainerNo: string;
  manifestContainerNo: string;
  discrepancyType: 'Container No' | 'Seal No' | 'Overweight' | 'Damage' | 'Size Class';
  varianceDescription: string;
  ocrConfidence: number;
  shippingLine: string;
  bookingNo: string;
  resolutionStatus: 'Resolved' | 'Overridden' | 'Pending Inspection';
  resolvedBy: string;
  resolutionDurationMins: number;
}

export interface YardOccupancyReportRow {
  id: string;
  blockName: string;
  yardZone: string;
  totalCapacityTeu: number;
  occupiedTeu: number;
  occupancyRatePercent: number;
  reeferSlotsTotal: number;
  reeferSlotsOccupied: number;
  averageDwellDays: number;
  longStayOver30DaysCount: number;
  criticalStackAlerts: number;
  lastAuditedTime: string;
}

export interface EquipmentProductivityReportRow {
  id: string;
  equipmentCode: string;
  equipmentType: 'Reach Stacker' | 'RTG Crane' | 'Heavy Forklift' | 'Terminal Tractor';
  assignedOperator: string;
  shift: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)';
  totalMoves: number;
  movesPerHour: number;
  operatingHours: number;
  idleHours: number;
  fuelConsumptionLitres: number;
  efficiencyRating: 'Optimal' | 'Standard' | 'Needs Attention';
}

export interface CustomsBillingReportRow {
  id: string;
  dossierNo: string;
  containerNo: string;
  blNumber: string;
  importerExporterName: string;
  cargoDescription: string;
  grossWeightKg: number;
  customsStatus: 'Cleared' | 'Under Examination' | 'Duty Pending' | 'Detained';
  bondedWarehouseDays: number;
  demurrageAccruedInr: number;
  clearanceTimestamp: string;
  examBayNo?: string;
}

export interface ReportKpiSummary {
  metric1Label: string;
  metric1Value: string | number;
  metric1Trend: string;
  metric1IsPositive: boolean;
  metric2Label: string;
  metric2Value: string | number;
  metric2Trend: string;
  metric2IsPositive: boolean;
  metric3Label: string;
  metric3Value: string | number;
  metric3Trend: string;
  metric3IsPositive: boolean;
  metric4Label: string;
  metric4Value: string | number;
  metric4Trend: string;
  metric4IsPositive: boolean;
}
