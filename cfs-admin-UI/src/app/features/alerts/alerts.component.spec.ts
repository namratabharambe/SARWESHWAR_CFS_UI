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
    alertService.alerts.set([
      {
        id: 'test-alt-1',
        alertCode: 'ALT-1',
        alertType: 'Container Number Mismatch',
        severity: 'Critical',
        status: 'Active',
        timestamp: new Date().toISOString(),
        gateLocation: 'Gate 1',
        truckNo: 'TR-1',
        driverName: 'Driver',
        driverLicense: 'DL-1',
        scannedContainerNo: 'C1',
        expectedContainerNo: 'C2',
        scannedSealNo: 'S1',
        expectedSealNo: 'S1',
        measuredWeightKg: 1000,
        manifestWeightKg: 1000,
        weightVariancePercentage: 0,
        ocrConfidence: 99,
        shippingLine: 'MSK',
        bookingNo: 'B1',
        isoType: "40' HC",
        systemRecommendation: 'Verify',
        comparisonFields: [],
      },
    ]);
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
