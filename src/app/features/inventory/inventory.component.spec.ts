import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InventoryComponent } from './inventory.component';
import { InventoryService } from 'shared/services/inventory.service';

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
});
