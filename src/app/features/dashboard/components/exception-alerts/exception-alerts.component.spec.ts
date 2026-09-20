import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { ExceptionAlertsComponent } from './exception-alerts.component';
import { ExceptionAlertItem } from 'shared/types/dashboard/dashboard.interface';

describe('ExceptionAlertsComponent', () => {
  let component: ExceptionAlertsComponent;
  let fixture: ComponentFixture<ExceptionAlertsComponent>;

  const mockAlerts: ExceptionAlertItem[] = [
    {
      id: 'exc-1',
      title: 'Overstay Container',
      description: 'TTNU 123456 7 has exceeded free time by 2 days',
      time: '10:20 AM',
      severity: 'danger',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExceptionAlertsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExceptionAlertsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('alerts', mockAlerts);
    fixture.detectChanges();
  });

  it('should create and render alerts list', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Exceptions / Alerts');
    expect(compiled.textContent).toContain('Overstay Container');
    expect(compiled.textContent).toContain('10:20 AM');
  });
});
