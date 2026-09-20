import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryService } from 'shared/services/inventory.service';
import { AddInventoryFormData, ContainerInventoryItem } from 'shared/types/inventory/inventory.interface';
import { AddInventoryModalComponent } from './components/add-inventory-modal/add-inventory-modal.component';
import { ContainerDetailDrawerComponent } from './components/container-detail-drawer/container-detail-drawer.component';
import { MoveContainerModalComponent } from './components/move-container-modal/move-container-modal.component';

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
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  public readonly inventoryService = inject(InventoryService);

  public readonly isAdvancedFiltersOpen = signal<boolean>(false);
  public readonly isColumnsDropdownOpen = signal<boolean>(false);

  // Shipping lines
  public readonly shippingLines = [
    'All',
    'MSK',
    'TCLU',
    'OOCL',
    'HMM',
    'TRHU',
    'COSC',
    'CMA',
    'NYK',
    'SUD',
    'PIL',
    'BEA',
    'ZIM',
    'TGHU',
    'UES',
  ];

  public readonly blocks = ['All', 'A', 'B', 'C', 'D', 'E', 'F'];
  public readonly rows = ['All', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '15'];
  public readonly bays = ['All', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
  public readonly tiers = ['All', '01', '02', '03', '04', '05'];
  public readonly sizes = ['All', "20'", "40'", "45'"];
  public readonly types = ['All', 'GP', 'HC', 'Reefer', 'OT', 'FR'];
  public readonly statuses = ['All', 'In Yard', 'Overstay', 'Hold', 'Ready Out'];
  public readonly fullEmptyOptions = ['All', 'Full', 'Empty'];

  public readonly customers = [
    'All',
    'Tata Motors Limited',
    'Reliance Industries Ltd',
    'Falcon Chemicals India',
    'Sun Pharma Exports',
    'Global Shippers Corp',
    'Orient Express Freight',
    'Beacon Intermodal',
    'CMA CGM Agency',
    'ZIM Integrated Shipping',
  ];

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
    this.inventoryService.showToast('Container inventory data refreshed.');
  }

  public exportCsv(): void {
    this.inventoryService.exportDataToCsv();
  }

  public printReport(): void {
    window.print();
  }
}
