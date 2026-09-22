export type TrendDirection = 'positive' | 'negative' | 'neutral';

export interface DashboardKpiMetric {
  id: string;
  label: string;
  value: string;
  trendText: string;
  trendDirection: TrendDirection;
  iconType: 'calendar' | 'truck-in' | 'truck-out' | 'tasks' | 'inventory' | 'exception';
  colorTheme: 'blue' | 'green' | 'orange' | 'purple' | 'sky' | 'red';
}

export type YardContainerStatus = 'import' | 'export' | 'empty' | 'hazard' | 'maintenance' | 'vacant';

export interface YardSlotCell {
  id: string;
  status: YardContainerStatus;
  containerNo?: string;
  tierCount?: number;
}

export interface YardGridBay {
  bayNumber: string;
  slots: YardContainerStatus[];
}

export interface YardBlockRow {
  rowLetter: string;
  bays: YardGridBay[];
}

export interface YardMetrics {
  totalBlocks: number;
  totalRows: number;
  teuCapacity: number;
  currentTeu: number;
  utilizationPercentage: number;
}

export type GateMovementType = 'IN' | 'OUT';
export type GateItemDirection = 'Import' | 'Export';
export type GateItemStatus = 'Verified' | 'Review' | 'Flagged';

export interface GateActivityItem {
  id: string;
  time: string;
  type: GateMovementType;
  truckNo: string;
  containerNo: string;
  sizeType: string;
  direction: GateItemDirection;
  ocrResult: string;
  ocrConfidence: number;
  status: GateItemStatus;
  imageUrl?: string;
}

export type ExceptionSeverity = 'danger' | 'warning' | 'info' | 'time';

export interface ExceptionAlertItem {
  id: string;
  title: string;
  description: string;
  time: string;
  severity: ExceptionSeverity;
}

export interface DonutChartSegment {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DonutChartData {
  title: string;
  totalCount: number;
  totalLabel: string;
  viewAllRoute?: string;
  segments: DonutChartSegment[];
}

export interface ContainerTypeMetric {
  typeName: string;
  count: number;
  percentage: number;
}

export interface InventoryCategorySummary {
  category: 'Import' | 'Export' | 'Empty' | 'Hazardous' | 'In Yard' | 'Review' | string;
  teuCount: number;
  percentage: number;
  colorTheme: 'blue' | 'green' | 'sky' | 'red';
}

export interface InventorySummaryData {
  categories: InventoryCategorySummary[];
  topContainerTypes: ContainerTypeMetric[];
  currentTeu: number;
  maxTeu: number;
  utilizationPercentage: number;
}
