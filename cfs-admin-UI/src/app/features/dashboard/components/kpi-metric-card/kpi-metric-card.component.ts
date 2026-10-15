import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardKpiMetric } from 'shared/types/dashboard/dashboard.interface';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-kpi-metric-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './kpi-metric-card.component.html',
  styleUrls: ['./kpi-metric-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiMetricCardComponent {
  public readonly metric = input.required<DashboardKpiMetric>();

  public readonly isPositive = computed(() => this.metric().trendDirection === 'positive');
  public readonly isNegative = computed(() => this.metric().trendDirection === 'negative');

  public readonly isZeroException = computed(() => {
    return this.metric().id === 'exceptions' && (this.metric().value === '0' || Number(this.metric().value) === 0);
  });

  public readonly cardRoute = computed<string>(() => {
    switch (this.metric().id) {
      case 'arrivals-today':
        return '/gate-events/in';
      case 'departures-today':
        return '/gate-events/out';
      case 'open-tasks':
        return '/tasks';
      case 'yard-inventory':
        return '/inventory';
      case 'exceptions':
        return '/alerts';
      default:
        return '/dashboard';
    }
  });

  public readonly shouldShowSparkline = computed<boolean>(() => true);

  public readonly sparklineColor = computed<string>(() => {
    switch (this.metric().id) {
      case 'arrivals-today':
        return '#3b82f6';
      case 'departures-today':
        return '#f59e0b';
      case 'open-tasks':
        return '#a081f7';
      case 'yard-inventory':
        return '#06b6d4';
      case 'exceptions':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  });

  public readonly sparklineLinePath = computed<string>(() => {
    if (this.metric().id === 'open-tasks') {
      return 'M0,32 C15,32 25,30 35,30 C45,30 50,18 60,18 C68,18 74,26 80,22 C86,18 90,12 96,6';
    }
    if (this.metric().id === 'exceptions') {
      return 'M0,10 C20,10 32,26 46,20 C60,16 72,28 96,32';
    }
    return 'M0,30 C20,30 32,20 46,24 C60,28 72,12 96,6';
  });

  public readonly sparklineAreaPath = computed<string>(() => {
    if (this.metric().id === 'open-tasks') {
      return 'M0,32 C15,32 25,30 35,30 C45,30 50,18 60,18 C68,18 74,26 80,22 C86,18 90,12 96,6 L96,40 L0,40 Z';
    }
    if (this.metric().id === 'exceptions') {
      return 'M0,10 C20,10 32,26 46,20 C60,16 72,28 96,32 L96,40 L0,40 Z';
    }
    return 'M0,30 C20,30 32,20 46,24 C60,28 72,12 96,6 L96,40 L0,40 Z';
  });
}
