import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusCategory = 'success' | 'pending' | 'error' | 'processing' | 'inactive';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  public readonly status = input<string | boolean>('Active');

  public readonly isActive = computed(() => {
    const val = this.status();
    return String(val).toLowerCase() === 'active' || val === true || String(val) === 'true';
  });

  public readonly statusCategory = computed<StatusCategory>(() => {
    const s = String(this.status()).toLowerCase().trim();
    if (s === 'active' || s === 'completed' || s === 'success' || s === 'done' || s === 'true') {
      return 'success';
    }
    if (s === 'pending' || s === 'waiting' || s === 'queued' || s === 'review' || s === 'draft') {
      return 'pending';
    }
    if (s === 'error' || s === 'cancelled' || s === 'canceled' || s === 'failed' || s === 'rejected') {
      return 'error';
    }
    if (s === 'processing' || s === 'in progress' || s === 'in_progress' || s === 'running' || s === 'moving') {
      return 'processing';
    }
    return 'inactive';
  });

  public readonly statusText = computed(() => {
    const val = this.status();
    if (typeof val === 'boolean') {
      return val ? 'Active' : 'Inactive';
    }
    return String(val);
  });
}
