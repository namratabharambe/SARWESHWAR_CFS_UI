import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryService } from 'shared/services/inventory.service';
import { AddInventoryFormData, ContainerInventoryItem } from 'shared/types/inventory/inventory.interface';
import { AddInventoryModalComponent } from './components/add-inventory-modal/add-inventory-modal.component';
import { ContainerDetailDrawerComponent } from './components/container-detail-drawer/container-detail-drawer.component';
import { MoveContainerModalComponent } from './components/move-container-modal/move-container-modal.component';
import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';
import { DatePickerComponent } from 'shared/components/molecules/date-picker/date-picker.component';
import { FilterApplyEvent, FilterField, FilterPanelComponent, FilterValues } from 'shared/components/molecules/filter-panel/filter-panel.component';
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
    DatePickerComponent,
    FilterPanelComponent,
    TranslatePipe,
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  public readonly inventoryService = inject(InventoryService);

  public readonly isQuickActionsOpen = signal<boolean>(false);
  public readonly selectedIds = signal<Set<string>>(new Set());
  public readonly selectedCount = computed<number>(() => this.selectedIds().size);

  public readonly isAllSelected = computed<boolean>(() => {
    const current = this.inventoryService.paginatedContainers();
    if (!current.length) return false;
    const selected = this.selectedIds();
    return current.every((c) => selected.has(c.id));
  });

  public readonly pageSizeOptions = [
    { value: 10, label: '10 per page' },
    { value: 25, label: '25 per page' },
    { value: 50, label: '50 per page' },
  ];

  public toggleSelectAll(): void {
    const current = this.inventoryService.paginatedContainers();
    const selected = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      current.forEach((c) => selected.delete(c.id));
    } else {
      current.forEach((c) => selected.add(c.id));
    }
    this.selectedIds.set(selected);
  }

  public toggleSelect(id: string): void {
    const selected = new Set(this.selectedIds());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedIds.set(selected);
  }

  public isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  public selectGateMode(mode: 'ALL' | 'GATE_IN' | 'GATE_OUT'): void {
    this.inventoryService.setGateMode(mode);
    this.selectedIds.set(new Set());
  }

  public selectKpiCard(kpi: string): void {
    this.inventoryService.selectKpiCard(kpi);
    this.selectedIds.set(new Set());
  }

  public readonly sortOptions = [
    { label: 'Date: newest first', value: 'date-desc' },
    { label: 'Date: oldest first', value: 'date-asc' },
    { label: 'Container No: A–Z', value: 'container-asc' },
    { label: 'Container No: Z–A', value: 'container-desc' },
    { label: 'Size', value: 'size' },
    { label: 'Location', value: 'location' },
  ];

  public readonly filterFields = computed<FilterField[]>(() => {
    const sizes = [...new Set(this.inventoryService.containers().map((c) => c.sizeType).filter(Boolean))].sort();
    return [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'range', label: 'Date range (from – to)', type: 'daterange' },
      { key: 'containerNo', label: 'Container No', type: 'text', placeholder: 'e.g. MSCU1234567' },
      { key: 'size', label: 'Size', type: 'select', options: [{ label: 'All sizes', value: 'All' }, ...sizes.map((x) => ({ label: x, value: x }))] },
      {
        key: 'location',
        label: 'Location',
        type: 'select',
        options: [
          { label: 'All locations', value: 'All' },
          { label: 'In Yard', value: 'In Yard' },
          { label: 'Gate Out', value: 'Gate Out' },
        ],
      },
    ];
  });

  public readonly filterValues = computed<FilterValues>(() => {
    const s = this.inventoryService;
    return {
      date: s.dateFilter(),
      rangeFrom: s.rangeFrom(),
      rangeTo: s.rangeTo(),
      containerNo: s.containerFilter(),
      size: s.sizeFilter(),
      location: s.locationFilter(),
    };
  });

  public onFilterApply(e: FilterApplyEvent): void {
    const s = this.inventoryService;
    const v = e.values;
    s.containerFilter.set(v['containerNo'] ?? '');
    s.sizeFilter.set(v['size'] ?? '');
    s.locationFilter.set(v['location'] ?? '');
    s.sortBy.set(e.sort || 'date-desc');
    if (!v['date'] && (v['rangeFrom'] || v['rangeTo'])) {
      s.setDateRange(v['rangeFrom'] ?? '', v['rangeTo'] ?? '');
    } else {
      s.rangeFrom.set('');
      s.rangeTo.set('');
      s.setDateFilter(v['date'] ?? '');
    }
    this.selectedIds.set(new Set());
  }

  public onDateFilterChange(val: string): void {
    this.inventoryService.setDateFilter(val);
    this.selectedIds.set(new Set());
  }

  public resetFilters(): void {
    this.inventoryService.selectedKpiFilter.set('All');
    this.inventoryService.setGateMode('ALL');
    this.inventoryService.setSearchQuery('');
    this.onFilterApply({ values: {}, sort: 'date-desc' });
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
    this.inventoryService.exportDataToCsv(this.selectedIds());
  }

  public setPage(page: number): void {
    this.inventoryService.setPage(page);
  }

  public setPageSize(size: number): void {
    this.inventoryService.setPageSize(size);
  }

  public printReport(): void {
    window.print();
  }
}