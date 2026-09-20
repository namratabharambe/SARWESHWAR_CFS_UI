import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { ReportService } from 'shared/services/report.service';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let reportService: ReportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [provideRouter([]), ReportService],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    reportService = TestBed.inject(ReportService);
    fixture.detectChanges();
  });

  it('should create ReportsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should switch report categories', () => {
    component.setCategory('yard-occupancy');
    expect(reportService.selectedCategory()).toBe('yard-occupancy');
  });

  it('should calculate active KPIs dynamically', () => {
    const kpi = reportService.activeKpis();
    expect(kpi.metric1Label).toBeTruthy();
    expect(kpi.metric1Value).toBeDefined();
  });
});
