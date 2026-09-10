import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-centered-divider',
  standalone: true,
  templateUrl: './centered-divider.component.html',
  styleUrls: ['./centered-divider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CenteredDividerComponent {
  public readonly label = input<string>('');
}
