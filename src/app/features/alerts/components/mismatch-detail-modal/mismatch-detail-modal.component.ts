import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertResolutionRequest, ContainerMismatchAlert } from 'shared/types/alert/alert.interface';

@Component({
  selector: 'app-mismatch-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mismatch-detail-modal.component.html',
  styleUrls: ['./mismatch-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MismatchDetailModalComponent {
  public readonly alert = input<ContainerMismatchAlert | null>(null);
  public readonly isOpen = input<boolean>(false);

  public readonly close = output<void>();
  public readonly resolved = output<AlertResolutionRequest>();

  public readonly resolutionNotes = signal<string>('');
  public readonly correctedSerial = signal<string>('');

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  public handleResolution(action: AlertResolutionRequest['action']): void {
    const current = this.alert();
    if (!current) return;

    this.resolved.emit({
      alertId: current.id,
      action,
      notes: this.resolutionNotes().trim(),
      operatorName: 'Ramesh Kumar (Yard Master)',
      correctedContainerNo: this.correctedSerial().trim() || undefined,
    });

    this.resolutionNotes.set('');
    this.correctedSerial.set('');
  }
}
