import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { StatusDonutChartComponent } from './status-donut-chart.component';
import { DonutChartData } from 'shared/types/dashboard/dashboard.interface';

describe('StatusDonutChartComponent', () => {
  let component: StatusDonutChartComponent;
  let fixture: ComponentFixture<StatusDonutChartComponent>;

  const mockData: DonutChartData = {
    title: 'Task Status',
    totalCount: 32,
    totalLabel: 'Total Tasks',
    viewAllRoute: '/tasks',
    segments: [
      { id: 'not-started', label: 'Not Started', count: 12, percentage: 37, color: '#94a3b8' },
      { id: 'in-progress', label: 'In Progress', count: 9, percentage: 28, color: '#2563eb' },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDonutChartComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusDonutChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('chartData', mockData);
    fixture.detectChanges();
  });

  it('should create and render title and center count', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Task Status');
    expect(compiled.textContent).toContain('32');
    expect(compiled.textContent).toContain('Total Tasks');
    expect(compiled.textContent).toContain('Not Started');
  });

  it('should calculate arc segment offsets correctly', () => {
    const segments = component.calculatedSegments();
    expect(segments.length).toBe(2);
    expect(Math.abs(segments[0].strokeDashoffset)).toBe(0);
    expect(segments[1].strokeDashoffset).toBeLessThan(0);
  });
});
