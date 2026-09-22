import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExceptionAlertItem } from 'shared/types/dashboard/dashboard.interface';

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
}
