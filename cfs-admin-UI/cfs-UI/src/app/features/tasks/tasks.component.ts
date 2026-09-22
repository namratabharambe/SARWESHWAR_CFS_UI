import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskService } from 'shared/services/task.service';
import { CreateTaskFormData, TaskItem, TaskPriority, TaskStatus, TaskType } from 'shared/types/task/task.interface';
import { CreateTaskModalComponent } from './components/create-task-modal/create-task-modal.component';
import { TaskDetailPanelComponent } from './components/task-detail-panel/task-detail-panel.component';
import { TaskQueueViewComponent } from './components/task-queue-view/task-queue-view.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TaskDetailPanelComponent,
    CreateTaskModalComponent,
    TaskQueueViewComponent,
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksComponent {
  public readonly taskService = inject(TaskService);

  // Status options for filter
  public readonly statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'New', label: 'New' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Awaiting Confirmation', label: 'Awaiting Confirmation' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Exception', label: 'Exceptions' },
  ];

  public readonly typeOptions = [
    { value: 'All', label: 'All Types' },
    { value: 'Import', label: 'Import' },
    { value: 'Export', label: 'Export' },
    { value: 'Yard Move', label: 'Yard Move' },
    { value: 'Stack', label: 'Stack' },
    { value: 'Gate Out', label: 'Gate Out' },
    { value: 'Inspection', label: 'Inspection' },
  ];

  public readonly priorityOptions = [
    { value: 'All', label: 'All Priorities' },
    { value: 'High', label: 'High Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'Low', label: 'Low Priority' },
    { value: 'Critical', label: 'Critical' },
  ];

  public readonly equipmentOptions = [
    { value: 'All', label: 'All Equipment' },
    { value: 'RS-07', label: 'Reach Stacker RS-07' },
    { value: 'RS-05', label: 'Reach Stacker RS-05' },
    { value: 'RS-01', label: 'Reach Stacker RS-01' },
    { value: 'RTG-01', label: 'RTG Crane RTG-01' },
    { value: 'RTG-02', label: 'RTG Crane RTG-02' },
    { value: 'RTG-03', label: 'RTG Crane RTG-03' },
    { value: 'FLT-01', label: 'Forklift FLT-01' },
    { value: 'FLT-02', label: 'Forklift FLT-02' },
  ];

  // Pagination display range
  public readonly displayRangeText = computed<string>(() => {
    const total = this.taskService.filteredTasks().length;
    if (total === 0) return '0 tasks';
    const page = this.taskService.currentPage();
    const size = this.taskService.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    const overallTotal = this.taskService.kpiMetrics().allTasks;
    return `Showing ${start} to ${end} of ${overallTotal} tasks`;
  });

  // Selected row count
  public readonly selectedCount = computed<number>(() => this.taskService.selectedTaskIds().size);

  // Export dropdown open state
  public readonly isExportMenuOpen = signal<boolean>(false);

  // Active KPI card filter helper
  public selectKpiStatus(status: string): void {
    if (this.taskService.statusFilter() === status) {
      this.taskService.setStatusFilter('All');
    } else {
      this.taskService.setStatusFilter(status);
    }
  }

  public openCreateModal(): void {
    this.taskService.isCreateModalOpen.set(true);
  }

  public closeCreateModal(): void {
    this.taskService.isCreateModalOpen.set(false);
  }

  public handleTaskCreated(data: CreateTaskFormData): void {
    this.taskService.createTask(data);
  }

  public toggleViewMode(): void {
    const current = this.taskService.viewMode();
    this.taskService.viewMode.set(current === 'table' ? 'queue' : 'table');
  }

  public refreshTasks(): void {
    this.taskService.showToast('Refreshed task records.');
  }

  public toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.taskService.selectAllOnPage(checked);
  }

  public toggleTaskSelect(id: string, event: Event): void {
    event.stopPropagation();
    this.taskService.toggleTaskSelection(id);
  }

  public resetAllFilters(): void {
    this.taskService.setStatusFilter('All');
    this.taskService.setTypeFilter('All');
    this.taskService.setPriorityFilter('All');
    this.taskService.setEquipmentFilter('All');
    this.taskService.setSearchQuery('');
    this.taskService.showToast('Filters cleared.');
  }

  public hasActiveFilters(): boolean {
    return (
      this.taskService.statusFilter() !== 'All' ||
      this.taskService.typeFilter() !== 'All' ||
      this.taskService.priorityFilter() !== 'All' ||
      this.taskService.equipmentFilter() !== 'All' ||
      this.taskService.searchQuery().trim().length > 0
    );
  }
}
