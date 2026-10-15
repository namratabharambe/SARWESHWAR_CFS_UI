import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from 'core/auth/auth.service';
import { KpiMetricCardComponent } from './components/kpi-metric-card/kpi-metric-card.component';
import { RecentGateActivityComponent } from './components/recent-gate-activity/recent-gate-activity.component';
import { YardCapacityUtilizationComponent } from './components/yard-capacity-utilization/yard-capacity-utilization.component';
import { YardOverviewComponent } from './components/yard-overview/yard-overview.component';
import { GateOperationsLiveComponent } from './components/gate-operations-live/gate-operations-live.component';
import { ExceptionAlertsComponent } from './components/exception-alerts/exception-alerts.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    KpiMetricCardComponent,
    YardOverviewComponent,
    GateOperationsLiveComponent,
    RecentGateActivityComponent,
    YardCapacityUtilizationComponent,
    ExceptionAlertsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  public readonly dashboardService = inject(DashboardService);
  public readonly auth = inject(AuthService);

  public readonly clientName = computed<string>(() => {
    const raw = this.auth.clientName();
    if (raw && raw !== 'Primary Client') return raw;
    const site = this.auth.siteName();
    if (site && site.toLowerCase().includes('sarveshwar')) return 'Sarveshwar Logistics';
    return raw || 'Sarveshwar Logistics';
  });

  public readonly siteName = computed<string>(() => {
    return this.auth.siteName() || 'Sarveshwar Panvel';
  });
}
