import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertsComponent } from './alerts.component';
import { AlertService } from 'shared/services/alert.service';

describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let alertService: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsComponent],
      providers: [provideRouter([]), AlertService],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
    alertService = TestBed.inject(AlertService);
    fixture.detectChanges();
  });

  it('should create AlertsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should filter alerts by severity', () => {
    alertService.setSeverityFilter('Critical');
    const filtered = alertService.filteredAlerts();
    expect(filtered.every((a) => a.severity === 'Critical')).toBe(true);
  });

  it('should resolve alert on resolution action', () => {
    const firstAlert = alertService.alerts()[0];
    alertService.resolveAlert({
      alertId: firstAlert.id,
      action: 'OVERRIDE_VERIFY',
      notes: 'Verified against manual physical manifest.',
      operatorName: 'Test Operator',
    });

    const updated = alertService.alerts().find((a) => a.id === firstAlert.id);
    expect(updated?.status).toBe('Resolved');
  });
});
