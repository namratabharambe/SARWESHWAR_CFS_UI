import { ChangeDetectionStrategy, Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GateActivityItem, GateItemStatus } from 'shared/types/dashboard/dashboard.interface';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-recent-gate-activity',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-gate-activity.component.html',
  styleUrls: ['./recent-gate-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentGateActivityComponent {
  private readonly dashboardService = inject(DashboardService);

  public readonly activities = input.required<GateActivityItem[]>();
  /** Latest 20 events; the card shows 5 at a time and scrolls for the rest. */
  public readonly latest = computed(() => this.activities().slice(0, 20));

  public statusLabel(status: GateItemStatus): string {
    return status === 'Review' ? 'Needs Review' : status === 'Flagged' ? 'Exception' : status;
  }

  public statusTone(status: GateItemStatus): string {
    return status === 'Review' ? 'st-warn' : status === 'Flagged' ? 'st-bad' : status === 'Processing' ? 'st-info' : 'st-good';
  }

  public date(item: GateActivityItem): string {
    return item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  }

  public readonly selectedActivity = this.dashboardService.selectedGateActivity;

  public openPreview(item: GateActivityItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.dashboardService.openActivityPreview(item);
  }

  public openLatestPreview(): void {
    const items = this.latest();
    if (items.length > 0) {
      this.dashboardService.openActivityPreview(items[0]);
    }
  }

  public closePreview(): void {
    this.dashboardService.closeActivityPreview();
  }

  @HostListener('window:keydown.escape')
  public onEscKey(): void {
    if (this.selectedActivity()) {
      this.closePreview();
    }
  }
}

