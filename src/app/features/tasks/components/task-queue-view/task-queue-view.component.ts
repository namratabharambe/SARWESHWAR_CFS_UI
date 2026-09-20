import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TaskItem, TaskStatus } from 'shared/types/task/task.interface';

interface QueueLane {
  status: TaskStatus;
  label: string;
  badgeClass: string;
  icon: string;
  tasks: TaskItem[];
}

@Component({
  selector: 'app-task-queue-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-queue-view.component.html',
  styleUrls: ['./task-queue-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskQueueViewComponent {
  public readonly tasks = input<TaskItem[]>([]);
  public readonly selectedTaskId = input<string | null>(null);

  public readonly taskSelected = output<TaskItem>();
  public readonly statusChanged = output<{ id: string; status: TaskStatus }>();

  public readonly lanes = computed<QueueLane[]>(() => {
    const list = this.tasks();
    return [
      {
        status: 'New',
        label: 'New Tasks',
        badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
        icon: 'note_add',
        tasks: list.filter((t) => t.status === 'New'),
      },
      {
        status: 'Assigned',
        label: 'Assigned',
        badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
        icon: 'person',
        tasks: list.filter((t) => t.status === 'Assigned'),
      },
      {
        status: 'In Progress',
        label: 'In Progress',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
        icon: 'autorenew',
        tasks: list.filter((t) => t.status === 'In Progress'),
      },
      {
        status: 'Awaiting Confirmation',
        label: 'Awaiting Confirmation',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
        icon: 'schedule',
        tasks: list.filter((t) => t.status === 'Awaiting Confirmation'),
      },
      {
        status: 'Completed',
        label: 'Completed',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
        icon: 'check_circle',
        tasks: list.filter((t) => t.status === 'Completed'),
      },
      {
        status: 'Exception',
        label: 'Exceptions',
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
        icon: 'warning',
        tasks: list.filter((t) => t.status === 'Exception'),
      },
    ];
  });

  public selectTask(task: TaskItem): void {
    this.taskSelected.emit(task);
  }

  public moveStatus(task: TaskItem, newStatus: TaskStatus, event: MouseEvent): void {
    event.stopPropagation();
    this.statusChanged.emit({ id: task.id, status: newStatus });
  }
}
