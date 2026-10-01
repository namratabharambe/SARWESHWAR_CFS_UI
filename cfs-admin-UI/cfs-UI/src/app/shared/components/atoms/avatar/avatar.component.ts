import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarStatus = 'online' | 'offline' | 'busy';

@Component({
  selector: 'app-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  public readonly name = input<string>('');
  public readonly imageUrl = input<string | null>(null);
  public readonly size = input<AvatarSize>('md');
  public readonly status = input<AvatarStatus | null>(null);

  public readonly initials = computed<string>(() => {
    const raw = (this.name() || '').trim();
    if (!raw) return 'U';
    const parts = raw.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  });

  public readonly sizeClasses = computed<string>(() => {
    switch (this.size()) {
      case 'sm':
        return 'w-7 h-7 text-xs';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'md':
      default:
        return 'w-9 h-9 text-sm';
    }
  });

  public readonly statusClasses = computed<string>(() => {
    switch (this.status()) {
      case 'online':
        return 'bg-emerald-500 ring-white dark:ring-gray-900';
      case 'busy':
        return 'bg-rose-500 ring-white dark:ring-gray-900';
      case 'offline':
        return 'bg-gray-400 ring-white dark:ring-gray-900';
      default:
        return '';
    }
  });
}
