import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ButtonType = 'button' | 'submit';
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  public readonly type = input<ButtonType>('button');
  public readonly variant = input<ButtonVariant>('primary');
  public readonly disabled = input<boolean>(false);
  public readonly loading = input<boolean>(false);
  public readonly icon = input<string>('');

  public readonly pressed = output<void>();

  public readonly buttonClasses = computed<string>(() => {
    switch (this.variant()) {
      case 'secondary':
        return 'btn-secondary rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
      case 'danger':
        return 'btn-danger rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95 focus:ring-rose-500';
      case 'text':
        return 'btn-text rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300';
      case 'primary':
      default:
        return 'btn-primary rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 focus:ring-blue-500';
    }
  });

  public onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.pressed.emit();
    }
  }
}
