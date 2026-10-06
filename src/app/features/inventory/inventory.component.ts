import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryService } from 'shared/services/inventory.service';
import { AddInventoryFormData, ContainerInventoryItem } from 'shared/types/inventory/inventory.interface';
import { AddInventoryModalComponent } from './components/add-inventory-modal/add-inventory-modal.component';
import { ContainerDetailDrawerComponent } from './components/container-detail-drawer/container-detail-drawer.component';
import { MoveContainerModalComponent } from './components/move-container-modal/move-container-modal.component';
import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AddInventoryModalComponent,
    ContainerDetailDrawerComponent,
    MoveContainerModalComponent,
    PaginationComponent,
    TranslatePipe,
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  public readonly inventoryService = inject(InventoryService);

  public readonly isQuickActionsOpen = signal<boolean>(false);
  public readonly isColumnsDropdownOpen = signal<boolean>(false);

  public readonly pageSizeOptions = [
    { value: 15, label: '15' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
  ];

  public selectGateMode(mode: 'ALL' | 'GATE_IN' | 'GATE_OUT'): void {
    this.inventoryService.setGateMode(mode);
  }

  public resetFilters(): void {
    this.inventoryService.setGateMode('ALL');
    this.inventoryService.setSearchQuery('');
  }

  public openAddModal(): void {
    this.inventoryService.isAddModalOpen.set(true);
  }

  public closeAddModal(): void {
    this.inventoryService.isAddModalOpen.set(false);
  }

  public handleSaveInventory(data: AddInventoryFormData): void {
    this.inventoryService.addInventory(data);
  }

  public openDrawer(c: ContainerInventoryItem): void {
    this.inventoryService.openDrawer(c);
  }

  public closeDrawer(): void {
    this.inventoryService.closeDrawer();
  }

  public openMoveModal(c: ContainerInventoryItem, event?: MouseEvent): void {
    event?.stopPropagation();
    this.inventoryService.openMoveModal(c);
  }

  public closeMoveModal(): void {
    this.inventoryService.closeMoveModal();
  }

  public handleMove(evt: { id: string; location: { block: string; row: string; bay: string; tier: string } }): void {
    this.inventoryService.moveContainer(evt.id, evt.location);
  }

  public handleToggleHold(evt: { id: string; holdType: string }, event?: MouseEvent): void {
    event?.stopPropagation();
    this.inventoryService.toggleHold(evt.id, evt.holdType);
  }

  public toggleStar(id: string, event: MouseEvent): void {
    this.inventoryService.toggleStar(id, event);
  }

  public refresh(): void {
    this.inventoryService.loadLiveGateData(this.inventoryService.activeGateMode());
    this.inventoryService.showToast('Live container inventory refreshed.');
  }

  public exportCsv(): void {
    this.inventoryService.exportDataToCsv();
  }

  public printReport(): void {
    window.print();
  }
}
