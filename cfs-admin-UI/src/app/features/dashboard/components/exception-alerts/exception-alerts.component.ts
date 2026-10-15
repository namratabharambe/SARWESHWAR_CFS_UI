import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExceptionAlertItem } from 'shared/types/dashboard/dashboard.interface';
import { DashboardService } from '../../services/dashboard.service';
import { AlertService } from 'shared/services/alert.service';

@Component({
  selector: 'app-exception-alerts',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './exception-alerts.component.html',
  styleUrls: ['./exception-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExceptionAlertsComponent {
  public readonly alerts = input.required<ExceptionAlertItem[]>();

  private readonly dashboardService = inject(DashboardService, { optional: true });
  private readonly alertService = inject(AlertService, { optional: true });

  public readonly isClearing = signal<boolean>(false);

  public clearAll(e?: Event): void {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.isClearing.set(true);
    setTimeout(() => {
      if (this.dashboardService) {
        this.dashboardService.clearAllAlerts();
      } else if (this.alertService) {
        this.alertService.clearAllAlerts();
      }
      this.isClearing.set(false);
    }, 200);
  }

  public simulateAlert(e?: Event): void {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (this.dashboardService) {
      this.dashboardService.simulateNewAlert();
    } else if (this.alertService) {
      this.alertService.simulateNewAlert();
    }
  }

  public restoreAlerts(e?: Event): void {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (this.dashboardService) {
      this.dashboardService.restoreSampleAlerts();
    } else if (this.alertService) {
      this.alertService.restoreSampleAlerts();
    }
  }
}
