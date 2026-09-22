export type TaskType = 'Import' | 'Export' | 'Yard Move' | 'Stack' | 'Gate Out' | 'De-stack' | 'Inspection';

export type TaskPriority = 'High' | 'Medium' | 'Low' | 'Critical';

export type TaskStatus = 'New' | 'Assigned' | 'In Progress' | 'Awaiting Confirmation' | 'Completed' | 'Exception';

export interface TaskItem {
  id: string;
  taskNo: string;
  taskType: TaskType;
  containerNo: string;
  sizeType: string;
  fromLocation: string;
  fromLocationDetail?: string;
  toLocation: string;
  toLocationDetail?: string;
  equipment: string;
  equipmentName?: string;
  operator: string;
  operatorAvatar?: string;
  bookingNo: string;
  priority: TaskPriority;
  slaMinutes: number;
  slaDisplay: string;
  isOverdue?: boolean;
  status: TaskStatus;
  dueTime: string;
  createdAt: string;
  updatedAt?: string;
  cargoType?: string;
  grossWeight?: string;
  sealNo?: string;
  isHazardous?: boolean;
  notes?: string;
}

export interface TaskKpiMetrics {
  allTasks: number;
  allTasksTrend: string;
  newTaskCount: number;
  newTaskTrend: string;
  assignedCount: number;
  assignedTrend: string;
  inProgressCount: number;
  inProgressTrend: string;
  awaitingConfirmationCount: number;
  awaitingConfirmationTrend: string;
  completedCount: number;
  completedTrend: string;
  exceptionsCount: number;
  exceptionsTrend: string;
}

export interface CreateTaskFormData {
  taskType: TaskType;
  containerNo: string;
  sizeType: string;
  fromLocation: string;
  toLocation: string;
  equipment: string;
  operator: string;
  bookingNo: string;
  priority: TaskPriority;
  slaMinutes: number;
  cargoType?: string;
  grossWeight?: string;
  sealNo?: string;
  isHazardous?: boolean;
  notes?: string;
}

export interface TaskFilterOptions {
  status: string;
  taskType: string;
  priority: string;
  equipment: string;
  date: string;
  searchQuery: string;
}
