import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from 'core/auth/auth.service';
import { MockAuthService, MockDashboardService } from 'shared/utility/test-mocks';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useClass: MockDashboardService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render dashboard sub-components', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-kpi-metric-card')).toBeTruthy();
    expect(compiled.querySelector('app-yard-snapshot')).toBeTruthy();
    expect(compiled.querySelector('app-recent-gate-activity')).toBeTruthy();
    expect(compiled.querySelector('app-exception-alerts')).toBeTruthy();
    expect(compiled.querySelector('app-inventory-summary')).toBeTruthy();
  });
});
