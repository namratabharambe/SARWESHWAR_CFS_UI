import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  public readonly status = input<string>('Active');

  public readonly isActive = computed(() => {
    const val = this.status();
    return String(val).toLowerCase() === 'active' || val === 'true';
  });

  public readonly statusText = computed(() => (this.isActive() ? 'Active' : 'Inactive'));
}
