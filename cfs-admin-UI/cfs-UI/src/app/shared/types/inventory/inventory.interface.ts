export type ContainerYardStatus = 'In Yard' | 'Overstay' | 'Hold' | 'Ready Out';

export type ContainerFullEmpty = 'Full' | 'Empty';

export interface ContainerInventoryItem {
  id: string;
  containerNo: string;
  sizeType: string;
  line: string;
  fullEmpty: ContainerFullEmpty;
  currentLocation: string;
  block: string;
  row: string;
  bay: string;
  tier: string;
  yardStatus: ContainerYardStatus;
  lastAction: string;
  lastUpdated: string;
  daysInYard: number;
  holds: string;
  isStarred?: boolean;
  hasWarning?: boolean;
  warningText?: string;
  customerName?: string;
  bookingNo?: string;
  blNumber?: string;
  cargoDescription?: string;
  grossWeightKg?: number;
  sealNo?: string;
  reeferTemp?: string;
  isHazardous?: boolean;
}

export interface InventoryKpiMetrics {
  totalContainers: number;
  totalTrend: string;
  importCount: number;
  importTrend: string;
  exportCount: number;
  exportTrend: string;
  emptyCount: number;
  emptyTrend: string;
  hazardousCount: number;
  hazardousTrend: string;
  overstayCount: number;
  overstayTrend: string;
}

export interface InventoryTypeDistribution {
  type: string;
  count: number;
  percent: number;
  color: string;
}

export interface BlockUtilization {
  block: string;
  percent: number;
  occupied: number;
  capacity: number;
}

export interface InventoryFilterOptions {
  containerNo: string;
  shippingLine: string;
  block: string;
  row: string;
  bay: string;
  tier: string;
  size: string;
  type: string;
  status: string;
  fullEmpty: string;
  customer: string;
  searchQuery: string;
}

export interface AddInventoryFormData {
  containerNo: string;
  sizeType: string;
  line: string;
  fullEmpty: ContainerFullEmpty;
  block: string;
  row: string;
  bay: string;
  tier: string;
  yardStatus: ContainerYardStatus;
  customerName?: string;
  bookingNo?: string;
  grossWeightKg?: number;
  sealNo?: string;
  isHazardous?: boolean;
  holds?: string;
}
