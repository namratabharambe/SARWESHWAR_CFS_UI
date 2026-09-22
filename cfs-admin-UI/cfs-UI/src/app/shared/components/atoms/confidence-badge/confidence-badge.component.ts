import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ConfidenceLevel = 'high' | 'med' | 'low';

@Component({
  selector: 'app-confidence-badge',
  standalone: true,
  templateUrl: './confidence-badge.component.html',
  styleUrls: ['./confidence-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidenceBadgeComponent {
  public readonly confidence = input<number>(0);
  public readonly showBars = input<boolean>(true);

  public readonly level = computed<ConfidenceLevel>(() => {
    const val = this.confidence();
    if (val >= 95) return 'high';
    if (val >= 90) return 'med';
    return 'low';
  });
}
