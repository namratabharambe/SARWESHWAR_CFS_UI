import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TranslatePipe } from 'shared/pipes';
import { TaskItem, TaskStatus } from 'shared/types/task/task.interface';

@Component({
  selector: 'app-task-detail-panel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './task-detail-panel.component.html',
  styleUrls: ['./task-detail-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailPanelComponent {
  public readonly task = input<TaskItem | null>(null);
  public readonly isCollapsed = signal<boolean>(false);
  public readonly copiedField = signal<string | null>(null);
  public readonly isFullDetailsOpen = signal<boolean>(false);

  public readonly statusChange = output<{ id: string; status: TaskStatus }>();
  public readonly closePanel = output<void>();

  public toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  public copyToClipboard(text: string, fieldName: string): void {
    navigator.clipboard.writeText(text);
    this.copiedField.set(fieldName);
    setTimeout(() => {
      if (this.copiedField() === fieldName) {
        this.copiedField.set(null);
      }
    }, 2000);
  }

  public setStatus(newStatus: TaskStatus): void {
    const current = this.task();
    if (current) {
      this.statusChange.emit({ id: current.id, status: newStatus });
    }
  }

  public openFullDetails(): void {
    this.isFullDetailsOpen.set(true);
  }

  public closeFullDetails(): void {
    this.isFullDetailsOpen.set(false);
  }
}
