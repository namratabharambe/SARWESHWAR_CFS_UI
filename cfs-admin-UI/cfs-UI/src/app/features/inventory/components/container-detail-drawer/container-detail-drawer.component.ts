import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContainerInventoryItem } from 'shared/types/inventory/inventory.interface';

@Component({
  selector: 'app-container-detail-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './container-detail-drawer.component.html',
  styleUrls: ['./container-detail-drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerDetailDrawerComponent {
  public readonly container = input<ContainerInventoryItem | null>(null);
  public readonly isOpen = input<boolean>(false);

  public readonly close = output<void>();
  public readonly move = output<ContainerInventoryItem>();
  public readonly toggleHold = output<{ id: string; holdType: string }>();

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('drawer-backdrop')) {
      this.close.emit();
    }
  }
}
