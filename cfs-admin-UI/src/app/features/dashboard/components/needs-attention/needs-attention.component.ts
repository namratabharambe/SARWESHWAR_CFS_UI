import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertService } from 'shared/services/alert.service';
import { TaskService } from 'shared/services/task.service';
import { InventoryService } from 'shared/services/inventory.service';
import { DashboardService } from '../../services/dashboard.service';

export interface AttentionItem {
  id: 'alerts' | 'tasks' | 'ocr' | 'overstay';
  title: string;
  detail: string;
  count: number;
  route: string;
  tone: string;
}

@Component({
  selector: 'app-needs-attention',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './needs-attention.component.html',
  styleUrls: ['./needs-attention.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeedsAttentionComponent {
  private readonly alerts = inject(AlertService).alerts;
  private readonly tasks = inject(TaskService).allTasks;
  private readonly containers = inject(InventoryService).containers;
  private readonly activities = inject(DashboardService).filteredGateActivities;

  public readonly items = computed<AttentionItem[]>(() => {
    const critical = this.alerts().filter(
      (a) => (a.severity === 'Critical' || a.severity === 'High') && a.status !== 'Resolved' && a.status !== 'Dismissed',
    ).length;
    const overdue = this.tasks().filter((t) => t.isOverdue && t.status !== 'Completed').length;
    const ocr = this.activities().filter((a) => a.status === 'Review' || a.status === 'Flagged').length;
    const overstay = this.containers().filter((c) => c.yardStatus === 'Overstay').length;

    return [
      { id: 'alerts', title: 'Critical alerts', detail: `${critical} requiring immediate review`, count: critical, route: '/alerts', tone: 'tone-bad' },
      { id: 'tasks', title: 'Overdue tasks', detail: `${overdue} ${overdue === 1 ? 'movement' : 'movements'} past due`, count: overdue, route: '/tasks', tone: 'tone-warn' },
      { id: 'ocr', title: 'OCR reviews', detail: `${ocr} awaiting verification`, count: ocr, route: '/gate-events', tone: 'tone-accent' },
      { id: 'overstay', title: 'Overstay containers', detail: `${overstay} in yard over 7 days`, count: overstay, route: '/inventory', tone: 'tone-good' },
    ];
  });

  /** Number of categories that currently have something open. */
  public readonly openCount = computed<number>(() => this.items().filter((i) => i.count > 0).length);
}
