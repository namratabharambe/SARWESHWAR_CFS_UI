import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from 'shared/components/molecules/dropdown/dropdown.component';
import { ContainerInventoryItem } from 'shared/types/inventory/inventory.interface';

import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-move-container-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, TranslatePipe],
  templateUrl: './move-container-modal.component.html',
  styleUrls: ['./move-container-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveContainerModalComponent {
  public readonly container = input<ContainerInventoryItem | null>(null);
  public readonly isOpen = input<boolean>(false);

  public readonly close = output<void>();
  public readonly move = output<{ id: string; location: { block: string; row: string; bay: string; tier: string } }>();

  public readonly targetBlock = signal<string>('B');
  public readonly targetRow = signal<string>('07');
  public readonly targetBay = signal<string>('03');
  public readonly targetTier = signal<string>('01');

  public readonly blockOptions: DropdownOption[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((b) => ({
    value: b,
    label: `Block ${b}`,
  }));

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  public submitMove(): void {
    const c = this.container();
    if (!c) return;

    this.move.emit({
      id: c.id,
      location: {
        block: this.targetBlock(),
        row: this.targetRow().padStart(2, '0'),
        bay: this.targetBay().padStart(2, '0'),
        tier: this.targetTier().padStart(2, '0'),
      },
    });
  }
}
