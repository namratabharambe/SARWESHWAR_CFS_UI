import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { InventorySummaryComponent } from './inventory-summary.component';
import { InventorySummaryData } from 'shared/types/dashboard/dashboard.interface';

describe('InventorySummaryComponent', () => {
  let component: InventorySummaryComponent;
  let fixture: ComponentFixture<InventorySummaryComponent>;

  const mockData: InventorySummaryData = {
    categories: [
      { category: 'Import', teuCount: 642, percentage: 51, colorTheme: 'blue' },
      { category: 'Export', teuCount: 392, percentage: 31, colorTheme: 'green' },
      { category: 'Empty', teuCount: 162, percentage: 13, colorTheme: 'sky' },
      { category: 'Hazardous', teuCount: 60, percentage: 5, colorTheme: 'red' },
    ],
    topContainerTypes: [
      { typeName: "40' High Cube", count: 712, percentage: 56 },
    ],
    currentTeu: 1256,
    maxTeu: 2400,
    utilizationPercentage: 52,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventorySummaryComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(InventorySummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create and render category summary and gauge', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Inventory Summary');
    expect(compiled.textContent).toContain('642');
    expect(compiled.textContent).toContain('52%');
    expect(compiled.textContent).toContain('1,256 / 2,400 TEU');
  });
});
