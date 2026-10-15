import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { ShellComponent } from './shell.component';
import { AuthService } from 'core/auth/auth.service';
import { AdminRepository } from 'core/data/admin.repository';
import { ThemeService } from 'core/services/theme.service';
import { DashboardService } from 'app/features/dashboard/services/dashboard.service';
import { MockAdminRepository, MockAuthService, MockDashboardService } from 'shared/utility/test-mocks';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        ThemeService,
        { provide: AuthService, useClass: MockAuthService },
        { provide: AdminRepository, useClass: MockAdminRepository },
        { provide: DashboardService, useClass: MockDashboardService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle location menu and minimize when clicking header or outside anywhere in project', () => {
    // 1. Initial state: closed
    expect(component.locationMenuOpen()).toBe(false);

    // 2. Click header: opens popup
    component.toggleLocationMenu();
    expect(component.locationMenuOpen()).toBe(true);

    // 3. Click header again: minimizes popup
    component.toggleLocationMenu();
    expect(component.locationMenuOpen()).toBe(false);

    // 4. Open popup again
    component.toggleLocationMenu();
    expect(component.locationMenuOpen()).toBe(true);

    // 5. Click outside anywhere in document: closes/minimizes popup
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    const outsideClickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(outsideClickEvent, 'target', { value: outsideElement });
    component.onDocumentClick(outsideClickEvent);
    expect(component.locationMenuOpen()).toBe(false);

    // Clean up
    document.body.removeChild(outsideElement);
  });
});