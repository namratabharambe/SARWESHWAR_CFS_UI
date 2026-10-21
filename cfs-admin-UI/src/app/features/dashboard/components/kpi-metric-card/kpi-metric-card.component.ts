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
      case 'alerts':
        return '/alerts';
      default:
        return '/dashboard';
    }
  });

  /** Color tone per card, matching the reference: blue, cyan, green, purple, amber. */
  public readonly tone = computed<string>(() => {
    switch (this.metric().id) {
      case 'departures-today':
        return 'tone-cyan';
      case 'yard-inventory':
        return 'tone-green';
      case 'open-tasks':
        return 'tone-purple';
      case 'exceptions':
      case 'alerts':
        return 'tone-amber';
      default:
        return 'tone-blue';
    }
  });

  public readonly unit = computed<string>(() => {
    switch (this.metric().id) {
      case 'open-tasks':
        return 'tasks';
      case 'exceptions':
      case 'alerts':
        return 'alerts';
      default:
        return 'containers';
    }
  });

  private readonly today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  public readonly caption = computed<string>(() => {
    const m = this.metric();
    if (m.trendText) return m.trendText;
    switch (m.id) {
      case 'arrivals-today':
      case 'departures-today':
        return `Today, ${this.today}`;
      case 'yard-inventory':
        return 'Current yard inventory';
      case 'open-tasks':
        return 'Across all operators';
      default:
        return Number(m.value) === 0 ? 'All clear' : 'Requires your attention';
    }
  });
}
