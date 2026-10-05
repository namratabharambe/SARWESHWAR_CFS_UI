import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GateActivityItem } from 'shared/types/dashboard/dashboard.interface';

@Component({
  selector: 'app-recent-gate-activity',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-gate-activity.component.html',
  styleUrls: ['./recent-gate-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentGateActivityComponent {
  private readonly router = inject(Router);

  public readonly activities = input.required<GateActivityItem[]>();
  /** Dashboard card shows only the latest 5 events; the full list lives in Gate Events. */
  public readonly latest = computed(() => this.activities().slice(0, 5));

  public onActivityClick(item: GateActivityItem): void {
    this.router.navigate(['/gate-events'], {
      queryParams: {
        cycle: item.type === 'OUT' ? 'OUT' : 'IN',
      },
    });
  }
}

