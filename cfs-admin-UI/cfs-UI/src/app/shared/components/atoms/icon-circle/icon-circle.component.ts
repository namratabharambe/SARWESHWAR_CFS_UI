import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon-circle',
  standalone: true,
  templateUrl: './icon-circle.component.html',
  styleUrls: ['./icon-circle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconCircleComponent {
  public readonly variant = input<'primary' | 'success' | 'danger' | 'neutral'>('primary');
  public readonly size = input<'sm' | 'md' | 'lg'>('md');
}
