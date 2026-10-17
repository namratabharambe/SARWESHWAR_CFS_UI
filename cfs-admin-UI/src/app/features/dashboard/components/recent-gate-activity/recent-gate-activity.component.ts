import { ChangeDetectionStrategy, Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GateActivityItem } from 'shared/types/dashboard/dashboard.interface';
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
  /** Dashboard card shows the latest 6 events filling the card space cleanly. */
  public readonly latest = computed(() => this.activities().slice(0, 6));

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

