import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { InventoryComponent } from './inventory.component';
import { InventoryService } from 'shared/services/inventory.service';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let inventoryService: InventoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), InventoryService],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    inventoryService = TestBed.inject(InventoryService);
    fixture.detectChanges();
  });

  it('should create InventoryComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should paginate across multiple pages (1, 2, 3, 4)', () => {
    expect(inventoryService.totalPages()).toBeGreaterThanOrEqual(4);
    expect(inventoryService.currentPage()).toBe(1);
    expect(inventoryService.paginatedContainers().length).toBe(10);

    inventoryService.setPage(2);
    expect(inventoryService.currentPage()).toBe(2);
    expect(inventoryService.pageStart()).toBe(11);
    expect(inventoryService.pageEnd()).toBe(20);

    inventoryService.setPage(3);
    expect(inventoryService.currentPage()).toBe(3);
    expect(inventoryService.pageStart()).toBe(21);

    inventoryService.setPage(4);
    expect(inventoryService.currentPage()).toBe(4);
    expect(inventoryService.pageStart()).toBe(31);
  });

  it('should calculate Gate In and Gate Out KPI metrics', () => {
    const kpis = inventoryService.kpiMetrics();
    expect(kpis.gateInCount).toBeGreaterThan(0);
    expect(kpis.gateOutCount).toBeGreaterThan(0);
    expect(kpis.totalContainers).toBeGreaterThan(0);
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
});
