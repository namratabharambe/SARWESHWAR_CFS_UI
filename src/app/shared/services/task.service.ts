import { Injectable, computed, signal } from '@angular/core';
import {
  CreateTaskFormData,
  TaskFilterOptions,
  TaskItem,
  TaskKpiMetrics,
  TaskPriority,
  TaskStatus,
  TaskType,
} from 'shared/types/task/task.interface';

@Injectable({ providedIn: 'root' })
export class TaskService {
  // Initial seed tasks matching design
  private readonly initialTasks: TaskItem[] = [
    {
      id: 'task-1',
      taskNo: 'TSK-2025-0517-0001',
      taskType: 'Import',
      containerNo: 'MSCU 556123 4',
      sizeType: "40' HC",
      fromLocation: 'GATE-01',
      fromLocationDetail: 'Main Gate',
      toLocation: 'BLOCK C / 04-02',
      toLocationDetail: 'Row 04 / Tier 2',
      equipment: 'RS-07',
      equipmentName: 'Reach Stacker RS-07',
      operator: 'Ramesh Kumar',
      bookingNo: 'BKGS2051709',
      priority: 'High',
      slaMinutes: -15,
      slaDisplay: '-00:15',
      isOverdue: true,
      status: 'In Progress',
      dueTime: '17 May 2025, 09:10 AM',
      createdAt: '2025-05-17T08:30:00Z',
      cargoType: 'Industrial Machinery',
      grossWeight: '28,450 KG',
      sealNo: 'ML-IN-982341',
      isHazardous: false,
      notes: 'Priority offload for expedited customs verification at Block C.',
    },
    {
      id: 'task-2',
      taskNo: 'TSK-2025-0517-0002',
      taskType: 'Export',
      containerNo: 'HMMU 123456 7',
      sizeType: "40' HC",
      fromLocation: 'BLOCK A / 02-05',
      fromLocationDetail: 'Row 02 / Tier 5',
      toLocation: 'GATE-02',
      toLocationDetail: 'Outbound Gate 2',
      equipment: 'RTG-03',
      equipmentName: 'RTG Crane 03',
      operator: 'Suresh Patel',
      bookingNo: 'EXP-889021',
      priority: 'High',
      slaMinutes: 10,
      slaDisplay: '00:10',
      isOverdue: false,
      status: 'Assigned',
      dueTime: '17 May 2025, 09:45 AM',
      createdAt: '2025-05-17T08:35:00Z',
      cargoType: 'Automotive Parts',
      grossWeight: '22,100 KG',
      sealNo: 'EXP-SEAL-7712',
    },
    {
      id: 'task-3',
      taskNo: 'TSK-2025-0517-0003',
      taskType: 'Yard Move',
      containerNo: 'CAIU 456789 2',
      sizeType: "20' GP",
      fromLocation: 'BLOCK B / 06-03',
      fromLocationDetail: 'Buffer Yard B',
      toLocation: 'BLOCK D / 01-04',
      toLocationDetail: 'Inspection Stacking Bay',
      equipment: 'FLT-02',
      equipmentName: 'Forklift FLT-02',
      operator: 'Vikram Singh',
      bookingNo: 'YRD-104922',
      priority: 'Medium',
      slaMinutes: 25,
      slaDisplay: '00:25',
      isOverdue: false,
      status: 'In Progress',
      dueTime: '17 May 2025, 10:00 AM',
      createdAt: '2025-05-17T08:40:00Z',
      cargoType: 'Textiles & Garments',
      grossWeight: '14,200 KG',
    },
    {
      id: 'task-4',
      taskNo: 'TSK-2025-0517-0004',
      taskType: 'Import',
      containerNo: 'TCLU 789012 3',
      sizeType: "40' HC",
      fromLocation: 'GATE-03',
      fromLocationDetail: 'Gate 3 Bay A',
      toLocation: 'BLOCK E / 03-06',
      toLocationDetail: 'Row 03 / Tier 6',
      equipment: 'RS-05',
      equipmentName: 'Reach Stacker RS-05',
      operator: 'Anil Deshmukh',
      bookingNo: 'IMP-993821',
      priority: 'Medium',
      slaMinutes: 40,
      slaDisplay: '00:40',
      isOverdue: false,
      status: 'Assigned',
      dueTime: '17 May 2025, 10:15 AM',
      createdAt: '2025-05-17T08:45:00Z',
      cargoType: 'Consumer Electronics',
      grossWeight: '19,800 KG',
      isHazardous: false,
    },
    {
      id: 'task-5',
      taskNo: 'TSK-2025-0517-0005',
      taskType: 'Export',
      containerNo: 'MSKU 234567 8',
      sizeType: "40' HC",
      fromLocation: 'BLOCK C / 05-01',
      fromLocationDetail: 'Row 05 / Tier 1',
      toLocation: 'GATE-01',
      toLocationDetail: 'Outbound Express',
      equipment: 'RTG-01',
      equipmentName: 'RTG Crane 01',
      operator: 'Ramesh Kumar',
      bookingNo: 'EXP-332910',
      priority: 'High',
      slaMinutes: -5,
      slaDisplay: '-00:05',
      isOverdue: true,
      status: 'Awaiting Confirmation',
      dueTime: '17 May 2025, 09:20 AM',
      createdAt: '2025-05-17T08:50:00Z',
      cargoType: 'Chemicals (Non-haz)',
      grossWeight: '26,500 KG',
      sealNo: 'MSK-990142',
    },
    {
      id: 'task-6',
      taskNo: 'TSK-2025-0517-0006',
      taskType: 'Stack',
      containerNo: 'BMOU 987654 1',
      sizeType: "20' GP",
      fromLocation: 'BLOCK D / 02-02',
      fromLocationDetail: 'Holding Pad 2',
      toLocation: 'BLOCK D / 05-03',
      toLocationDetail: 'Consolidation Stack',
      equipment: 'RS-02',
      equipmentName: 'Reach Stacker RS-02',
      operator: 'Deepak Sharma',
      bookingNo: 'STK-001294',
      priority: 'Low',
      slaMinutes: 75,
      slaDisplay: '01:15',
      isOverdue: false,
      status: 'New',
      dueTime: '17 May 2025, 11:30 AM',
      createdAt: '2025-05-17T08:55:00Z',
      cargoType: 'Empty Container',
      grossWeight: '2,300 KG',
    },
    {
      id: 'task-7',
      taskNo: 'TSK-2025-0517-0007',
      taskType: 'Gate Out',
      containerNo: 'OOLU 123456 1',
      sizeType: "40' HC",
      fromLocation: 'BLOCK F / 01-01',
      fromLocationDetail: 'Heavy Staging F',
      toLocation: 'GATE-02',
      toLocationDetail: 'Exit Gate 2',
      equipment: 'RS-01',
      equipmentName: 'Reach Stacker RS-01',
      operator: 'Suresh Patel',
      bookingNo: 'GTO-776201',
      priority: 'High',
      slaMinutes: 5,
      slaDisplay: '00:05',
      isOverdue: false,
      status: 'Assigned',
      dueTime: '17 May 2025, 09:35 AM',
      createdAt: '2025-05-17T09:00:00Z',
      cargoType: 'Pharma / Temperature Controlled',
      grossWeight: '21,400 KG',
    },
    {
      id: 'task-8',
      taskNo: 'TSK-2025-0517-0008',
      taskType: 'Yard Move',
      containerNo: 'TRHU 765432 1',
      sizeType: "40' HC",
      fromLocation: 'BLOCK A / 04-04',
      fromLocationDetail: 'Block A Tier 4',
      toLocation: 'BLOCK B / 03-02',
      toLocationDetail: 'Block B Tier 2',
      equipment: 'FLT-01',
      equipmentName: 'Forklift FLT-01',
      operator: 'Vikram Singh',
      bookingNo: 'YRD-884019',
      priority: 'Medium',
      slaMinutes: 55,
      slaDisplay: '00:55',
      isOverdue: false,
      status: 'In Progress',
      dueTime: '17 May 2025, 10:45 AM',
      createdAt: '2025-05-17T09:05:00Z',
      cargoType: 'Ceramic Tiles',
      grossWeight: '27,100 KG',
    },
    {
      id: 'task-9',
      taskNo: 'TSK-2025-0517-0009',
      taskType: 'Import',
      containerNo: 'SEGU 456123 0',
      sizeType: "20' GP",
      fromLocation: 'GATE-01',
      fromLocationDetail: 'Inbound Gate 1',
      toLocation: 'BLOCK E / 02-01',
      toLocationDetail: 'Row 02 / Tier 1',
      equipment: 'RS-06',
      equipmentName: 'Reach Stacker RS-06',
      operator: 'Anil Deshmukh',
      bookingNo: 'IMP-220194',
      priority: 'Low',
      slaMinutes: 80,
      slaDisplay: '01:20',
      isOverdue: false,
      status: 'New',
      dueTime: '17 May 2025, 11:45 AM',
      createdAt: '2025-05-17T09:10:00Z',
      cargoType: 'Raw Cotton Bales',
      grossWeight: '18,500 KG',
    },
    {
      id: 'task-10',
      taskNo: 'TSK-2025-0517-0010',
      taskType: 'Export',
      containerNo: 'WANU 123987 6',
      sizeType: "40' HC",
      fromLocation: 'BLOCK B / 05-05',
      fromLocationDetail: 'Row 05 / Tier 5',
      toLocation: 'GATE-03',
      toLocationDetail: 'Outbound Gate 3',
      equipment: 'RTG-02',
      equipmentName: 'RTG Crane 02',
      operator: 'Ramesh Kumar',
      bookingNo: 'EXP-665209',
      priority: 'Medium',
      slaMinutes: 35,
      slaDisplay: '00:35',
      isOverdue: false,
      status: 'Awaiting Confirmation',
      dueTime: '17 May 2025, 10:20 AM',
      createdAt: '2025-05-17T09:15:00Z',
      cargoType: 'Stainless Steel Coils',
      grossWeight: '29,000 KG',
      sealNo: 'WAN-550192',
    },
    {
      id: 'task-11',
      taskNo: 'TSK-2025-0517-0011',
      taskType: 'Inspection',
      containerNo: 'HLXU 882019 4',
      sizeType: "40' HC",
      fromLocation: 'BLOCK C / 02-01',
      fromLocationDetail: 'Row 02 / Tier 1',
      toLocation: 'INSPECT-BAY-1',
      toLocationDetail: 'Customs Examination Zone',
      equipment: 'RS-07',
      equipmentName: 'Reach Stacker RS-07',
      operator: 'Deepak Sharma',
      bookingNo: 'CUS-449102',
      priority: 'High',
      slaMinutes: 15,
      slaDisplay: '00:15',
      isOverdue: false,
      status: 'In Progress',
      dueTime: '17 May 2025, 10:00 AM',
      createdAt: '2025-05-17T09:20:00Z',
      cargoType: 'High Value Electronics',
      grossWeight: '16,700 KG',
      sealNo: 'CUS-EXAM-99',
    },
    {
      id: 'task-12',
      taskNo: 'TSK-2025-0517-0012',
      taskType: 'Yard Move',
      containerNo: 'CMAU 773190 2',
      sizeType: "20' GP",
      fromLocation: 'BLOCK D / 01-02',
      fromLocationDetail: 'Block D Bay 1',
      toLocation: 'BLOCK D / 06-04',
      toLocationDetail: 'Tier Reallocation',
      equipment: 'FLT-02',
      equipmentName: 'Forklift FLT-02',
      operator: 'Vikram Singh',
      bookingNo: 'YRD-551029',
      priority: 'Low',
      slaMinutes: 120,
      slaDisplay: '02:00',
      isOverdue: false,
      status: 'Completed',
      dueTime: '17 May 2025, 08:30 AM',
      createdAt: '2025-05-17T07:45:00Z',
      cargoType: 'General Merchandise',
      grossWeight: '12,000 KG',
    },
    {
      id: 'task-13',
      taskNo: 'TSK-2025-0517-0013',
      taskType: 'Stack',
      containerNo: 'TEMU 992011 8',
      sizeType: "40' HC",
      fromLocation: 'GATE-01',
      fromLocationDetail: 'Gate 1 Intake',
      toLocation: 'BLOCK A / 01-01',
      toLocationDetail: 'Reefer Power Station',
      equipment: 'RS-05',
      equipmentName: 'Reach Stacker RS-05',
      operator: 'Anil Deshmukh',
      bookingNo: 'RF-991048',
      priority: 'Critical',
      slaMinutes: -30,
      slaDisplay: '-00:30',
      isOverdue: true,
      status: 'Exception',
      dueTime: '17 May 2025, 08:45 AM',
      createdAt: '2025-05-17T08:00:00Z',
      cargoType: 'Frozen Seafood (Reefer)',
      grossWeight: '25,600 KG',
      isHazardous: false,
      notes: 'Plug point fault detected at Block A Reefer rack. Manual maintenance required.',
    },
  ];

  // Live Task Collection signal
  public readonly allTasks = signal<TaskItem[]>(this.initialTasks);

  // Active Selected Task for Detail Flyout Panel
  public readonly selectedTask = signal<TaskItem | null>(this.initialTasks[0]);

  // Multi-selection set of IDs
  public readonly selectedTaskIds = signal<Set<string>>(new Set(['task-1']));

  // View Mode: 'table' or 'queue'
  public readonly viewMode = signal<'table' | 'queue'>('table');

  // Modal open states
  public readonly isCreateModalOpen = signal<boolean>(false);
  public readonly isDetailDrawerOpen = signal<boolean>(true);

  // Filter Signals
  public readonly statusFilter = signal<string>('All');
  public readonly typeFilter = signal<string>('All');
  public readonly priorityFilter = signal<string>('All');
  public readonly equipmentFilter = signal<string>('All');
  public readonly dateFilter = signal<string>('17 May 2025');
  public readonly searchQuery = signal<string>('');

  // Pagination Signals
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  // Notification Toast state
  public readonly toastMessage = signal<string | null>(null);

  // Filtered tasks computation
  public readonly filteredTasks = computed<TaskItem[]>(() => {
    let list = this.allTasks();
    const status = this.statusFilter();
    const type = this.typeFilter();
    const priority = this.priorityFilter();
    const equipment = this.equipmentFilter();
    const query = this.searchQuery().trim().toLowerCase();

    if (status !== 'All') {
      list = list.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    }

    if (type !== 'All') {
      list = list.filter((t) => t.taskType.toLowerCase() === type.toLowerCase());
    }

    if (priority !== 'All') {
      list = list.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
    }

    if (equipment !== 'All') {
      list = list.filter((t) => t.equipment.toLowerCase().includes(equipment.toLowerCase()));
    }

    if (query) {
      list = list.filter(
        (t) =>
          t.taskNo.toLowerCase().includes(query) ||
          t.containerNo.toLowerCase().includes(query) ||
          t.bookingNo.toLowerCase().includes(query) ||
          t.operator.toLowerCase().includes(query) ||
          t.fromLocation.toLowerCase().includes(query) ||
          t.toLocation.toLowerCase().includes(query) ||
          t.equipment.toLowerCase().includes(query),
      );
    }

    return list;
  });

  // KPI Metrics matching the design mockup values (with dynamic calculation backup)
  public readonly kpiMetrics = computed<TaskKpiMetrics>(() => {
    const list = this.allTasks();
    const newCount = list.filter((t) => t.status === 'New').length;
    const assignedCount = list.filter((t) => t.status === 'Assigned').length;
    const inProgressCount = list.filter((t) => t.status === 'In Progress').length;
    const awaitingConfCount = list.filter((t) => t.status === 'Awaiting Confirmation').length;
    const completedCount = list.filter((t) => t.status === 'Completed').length;
    const exceptionsCount = list.filter((t) => t.status === 'Exception' || t.isOverdue).length;

    // Fixed realistic totals matching screenshot 126 All, 28 New, 34 Assigned, etc.
    const allTotal = 126 + (list.length - this.initialTasks.length);

    return {
      allTasks: allTotal,
      allTasksTrend: '12% vs yesterday',
      newTaskCount: 28 + (newCount - 2),
      newTaskTrend: '16% vs yesterday',
      assignedCount: 34 + (assignedCount - 3),
      assignedTrend: '8% vs yesterday',
      inProgressCount: 31 + (inProgressCount - 4),
      inProgressTrend: '6% vs yesterday',
      awaitingConfirmationCount: 14 + (awaitingConfCount - 2),
      awaitingConfirmationTrend: '7% vs yesterday',
      completedCount: 15 + (completedCount - 1),
      completedTrend: '20% vs yesterday',
      exceptionsCount: 4 + (exceptionsCount - 3),
      exceptionsTrend: '20% vs yesterday',
    };
  });

  // Paginated tasks computation
  public readonly paginatedTasks = computed<TaskItem[]>(() => {
    const list = this.filteredTasks();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  // Total pages
  public readonly totalPages = computed<number>(() => {
    const total = this.filteredTasks().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  // Actions
  public setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
  }

  public setTypeFilter(type: string): void {
    this.typeFilter.set(type);
    this.currentPage.set(1);
  }

  public setPriorityFilter(priority: string): void {
    this.priorityFilter.set(priority);
    this.currentPage.set(1);
  }

  public setEquipmentFilter(equipment: string): void {
    this.equipmentFilter.set(equipment);
    this.currentPage.set(1);
  }

  public setDateFilter(date: string): void {
    this.dateFilter.set(date);
    this.currentPage.set(1);
  }

  public setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  public setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  public setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  public selectTask(task: TaskItem): void {
    this.selectedTask.set(task);
    this.isDetailDrawerOpen.set(true);
  }

  public toggleTaskSelection(id: string): void {
    this.selectedTaskIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  public selectAllOnPage(select: boolean): void {
    const pageItems = this.paginatedTasks();
    this.selectedTaskIds.update((set) => {
      const next = new Set(set);
      pageItems.forEach((item) => {
        if (select) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }
      });
      return next;
    });
  }

  public clearSelection(): void {
    this.selectedTaskIds.set(new Set());
  }

  public isAllPageSelected(): boolean {
    const pageItems = this.paginatedTasks();
    if (pageItems.length === 0) return false;
    const currentSet = this.selectedTaskIds();
    return pageItems.every((item) => currentSet.has(item.id));
  }

  public isTaskSelected(id: string): boolean {
    return this.selectedTaskIds().has(id);
  }

  public updateTaskStatus(id: string, newStatus: TaskStatus): void {
    this.allTasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)),
    );

    const currentSelected = this.selectedTask();
    if (currentSelected && currentSelected.id === id) {
      this.selectedTask.set({ ...currentSelected, status: newStatus, updatedAt: new Date().toISOString() });
    }

    this.showToast(`Task ${id} status updated to ${newStatus}`);
  }

  public createTask(form: CreateTaskFormData): TaskItem {
    const count = this.allTasks().length + 1;
    const padCount = count.toString().padStart(4, '0');
    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')} May 2025, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      taskNo: `TSK-2025-0517-${padCount}`,
      taskType: form.taskType,
      containerNo: form.containerNo.toUpperCase(),
      sizeType: form.sizeType || "40' HC",
      fromLocation: form.fromLocation,
      fromLocationDetail: 'Assigned CFS Origin',
      toLocation: form.toLocation,
      toLocationDetail: 'Assigned CFS Destination',
      equipment: form.equipment,
      equipmentName: `Equipment ${form.equipment}`,
      operator: form.operator || 'Ramesh Kumar',
      bookingNo: form.bookingNo || `BKGS-${Date.now().toString().slice(-6)}`,
      priority: form.priority,
      slaMinutes: form.slaMinutes || 45,
      slaDisplay:
        form.slaMinutes < 0
          ? `-${Math.abs(form.slaMinutes).toString().padStart(2, '0')}:00`
          : `00:${form.slaMinutes.toString().padStart(2, '0')}`,
      isOverdue: form.slaMinutes < 0,
      status: 'New',
      dueTime: dateFormatted,
      createdAt: now.toISOString(),
      cargoType: form.cargoType || 'General Freight',
      grossWeight: form.grossWeight || '24,000 KG',
      sealNo: form.sealNo || `SEAL-${Date.now().toString().slice(-4)}`,
      isHazardous: form.isHazardous || false,
      notes: form.notes || 'Created via Dispatcher Studio.',
    };

    this.allTasks.update((tasks) => [newTask, ...tasks]);
    this.selectedTask.set(newTask);
    this.showToast(`Task ${newTask.taskNo} created successfully!`);
    return newTask;
  }

  public deleteTask(id: string): void {
    this.allTasks.update((tasks) => tasks.filter((t) => t.id !== id));
    this.selectedTaskIds.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
    if (this.selectedTask()?.id === id) {
      const remaining = this.allTasks();
      this.selectedTask.set(remaining.length > 0 ? remaining[0] : null);
    }
    this.showToast('Task removed.');
  }

  public showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  public exportTasksToCsv(): void {
    const tasks = this.filteredTasks();
    const headers = [
      'Task No',
      'Type',
      'Container No',
      'Size',
      'From',
      'To',
      'Equipment',
      'Operator',
      'Priority',
      'SLA',
      'Status',
      'Due Time',
    ];
    const rows = tasks.map((t) => [
      t.taskNo,
      t.taskType,
      t.containerNo,
      t.sizeType,
      t.fromLocation,
      t.toLocation,
      t.equipment,
      t.operator,
      t.priority,
      t.slaDisplay,
      t.status,
      t.dueTime,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cfs-tasks-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Tasks exported to CSV successfully.');
  }
}
