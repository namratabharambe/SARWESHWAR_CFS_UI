import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { KpiMetricCardComponent } from './kpi-metric-card.component';
import { DashboardKpiMetric } from 'shared/types/dashboard/dashboard.interface';

describe('KpiMetricCardComponent', () => {
  let component: KpiMetricCardComponent;
  let fixture: ComponentFixture<KpiMetricCardComponent>;

  const mockMetric: DashboardKpiMetric = {
    id: 'test-kpi',
    label: 'Arrivals Today',
    value: '28',
    trendText: '16% vs yesterday',
    trendDirection: 'positive',
    iconType: 'truck-in',
    colorTheme: 'green',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiMetricCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiMetricCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('metric', mockMetric);
    fixture.detectChanges();
  });

  it('should create and render metric data', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Arrivals Today');
    expect(compiled.textContent).toContain('28');
    expect(compiled.textContent).toContain('16% vs yesterday');
  });

  it('should correctly compute isPositive', () => {
    expect(component.isPositive()).toBe(true);
    expect(component.isNegative()).toBe(false);
  });
});
