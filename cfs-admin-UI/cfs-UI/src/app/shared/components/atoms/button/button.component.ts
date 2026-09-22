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
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      case 'text':
        return 'btn-text';
      case 'primary':
      default:
        return 'btn-primary';
    }
  });

  public onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.pressed.emit();
    }
  }
}
