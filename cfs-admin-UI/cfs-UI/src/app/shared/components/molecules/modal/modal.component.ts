import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  public readonly title = input.required<string>();
  public readonly subtitle = input<string>('');
  public readonly icon = input<string>('');
  public readonly size = input<ModalSize>('md');
  public readonly closed = output<void>();

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }
}
