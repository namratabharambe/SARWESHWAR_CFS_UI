import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExceptionAlertItem } from 'shared/types/dashboard/dashboard.interface';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-exception-alerts',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './exception-alerts.component.html',
  styleUrls: ['./exception-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExceptionAlertsComponent {
  public readonly alerts = input.required<ExceptionAlertItem[]>();
}
