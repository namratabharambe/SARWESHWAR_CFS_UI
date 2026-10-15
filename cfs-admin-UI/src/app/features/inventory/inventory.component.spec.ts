import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { InventoryService } from 'shared/services/inventory.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let inventoryService: InventoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [provideRouter([]), InventoryService],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    inventoryService = TestBed.inject(InventoryService);
    fixture.detectChanges();
  });

  it('should create InventoryComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should filter containers by line', () => {
    inventoryService.updateFilter('shippingLine', 'MSK');
    const filtered = inventoryService.filteredContainers();
    expect(filtered.every((c) => c.line === 'MSK')).toBe(true);
  });

  it('should add container to inventory', () => {
    const initialCount = inventoryService.containers().length;
    const added = inventoryService.addInventory({
      containerNo: 'TEST 999999 9',
      sizeType: "40' HC",
      line: 'MSK',
      fullEmpty: 'Full',
      block: 'A',
      row: '01',
      bay: '01',
      tier: '01',
      yardStatus: 'In Yard',
    });

    expect(added).toBeTruthy();
    expect(inventoryService.containers().length).toBe(initialCount + 1);
  });

  it('should toggle selection and select all properly', () => {
    inventoryService.containers.set([
      { id: 'c-1', containerNo: 'MSKU 123456 1', sizeType: "40' HC", line: 'MSK', fullEmpty: 'Full', cargoType: 'Import', currentLocation: 'In Yard', block: 'A', row: '01', bay: '01', tier: '01', yardStatus: 'In Yard', lastAction: 'Gated In', arrivalDate: new Date().toISOString(), lastUpdated: 'Today', daysInYard: 2, holds: '-' },
      { id: 'c-2', containerNo: 'MSKU 654321 2', sizeType: "20' GP", line: 'MSK', fullEmpty: 'Empty', cargoType: 'Empty', currentLocation: 'In Yard', block: 'B', row: '02', bay: '02', tier: '02', yardStatus: 'In Yard', lastAction: 'Gated In', arrivalDate: new Date().toISOString(), lastUpdated: 'Today', daysInYard: 1, holds: '-' },
    ]);

    expect(component.isAllSelected()).toBe(false);
    const firstContainer = inventoryService.paginatedContainers()[0];
    expect(firstContainer).toBeTruthy();

    component.toggleSelect(firstContainer.id);
    expect(component.isSelected(firstContainer.id)).toBe(true);
    expect(component.selectedCount()).toBe(1);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(true);
    expect(component.selectedCount()).toBe(inventoryService.paginatedContainers().length);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(false);
    expect(component.selectedCount()).toBe(0);
  });

  it('should filter containers when KPI card is selected', () => {
    inventoryService.containers.set([
      { id: 'c-1', containerNo: 'MSKU 123456 1', sizeType: "40' HC", line: 'MSK', fullEmpty: 'Full', cargoType: 'Import', currentLocation: 'In Yard', block: 'A', row: '01', bay: '01', tier: '01', yardStatus: 'In Yard', lastAction: 'Gated In', arrivalDate: new Date().toISOString(), lastUpdated: 'Today', daysInYard: 2, holds: '-' },
      { id: 'c-2', containerNo: 'MSKU 654321 2', sizeType: "20' GP", line: 'MSK', fullEmpty: 'Full', cargoType: 'Export', currentLocation: 'Gate Out', block: 'B', row: '02', bay: '02', tier: '02', yardStatus: 'Gate Out', lastAction: 'Gated Out', arrivalDate: new Date().toISOString(), lastUpdated: 'Today', daysInYard: 1, holds: '-' },
    ]);

    component.selectKpiCard('Total Gate In');
    expect(inventoryService.selectedKpiFilter()).toBe('Total Gate In');
    expect(inventoryService.filteredContainers().every((c) => c.lastAction === 'Gated In' || c.currentLocation !== 'Gate Out')).toBe(true);

    component.selectKpiCard('Total Gate In'); // Toggle off back to All
    expect(inventoryService.selectedKpiFilter()).toBe('All');
  });

  it('should call exportDataToCsv with selected IDs on exportCsv', () => {
    inventoryService.containers.set([
      { id: 'c-1', containerNo: 'MSKU 123456 1', sizeType: "40' HC", line: 'MSK', fullEmpty: 'Full', cargoType: 'Import', currentLocation: 'In Yard', block: 'A', row: '01', bay: '01', tier: '01', yardStatus: 'In Yard', lastAction: 'Gated In', arrivalDate: new Date().toISOString(), lastUpdated: 'Today', daysInYard: 2, holds: '-' },
    ]);
    const spy = vi.spyOn(inventoryService, 'exportDataToCsv');
    const firstContainer = inventoryService.paginatedContainers()[0];
    component.toggleSelect(firstContainer.id);

    component.exportCsv();
    expect(spy).toHaveBeenCalledWith(component.selectedIds());
  });
});