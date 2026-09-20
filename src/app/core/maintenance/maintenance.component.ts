import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceComponent {}
