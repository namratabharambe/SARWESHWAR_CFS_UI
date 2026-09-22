import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from 'core/auth/auth.service';
import { KpiMetricCardComponent } from './components/kpi-metric-card/kpi-metric-card.component';
import { YardSnapshotComponent } from './components/yard-snapshot/yard-snapshot.component';
import { RecentGateActivityComponent } from './components/recent-gate-activity/recent-gate-activity.component';
import { ExceptionAlertsComponent } from './components/exception-alerts/exception-alerts.component';
import { StatusDonutChartComponent } from './components/status-donut-chart/status-donut-chart.component';
import { InventorySummaryComponent } from './components/inventory-summary/inventory-summary.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    KpiMetricCardComponent,
    YardSnapshotComponent,
    RecentGateActivityComponent,
    ExceptionAlertsComponent,
    StatusDonutChartComponent,
    InventorySummaryComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  public readonly dashboardService = inject(DashboardService);
  public readonly auth = inject(AuthService);

  public ngOnInit(): void {
    this.dashboardService.loadGateActivities();
  }
}
