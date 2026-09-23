import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DashboardKpiMetric } from 'shared/types/dashboard/dashboard.interface';

import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-kpi-metric-card',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './kpi-metric-card.component.html',
  styleUrls: ['./kpi-metric-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiMetricCardComponent {
  public readonly metric = input.required<DashboardKpiMetric>();

  public readonly isPositive = computed(() => this.metric().trendDirection === 'positive');
  public readonly isNegative = computed(() => this.metric().trendDirection === 'negative');
}
