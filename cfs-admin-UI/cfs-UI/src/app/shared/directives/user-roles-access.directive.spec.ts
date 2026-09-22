import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UserRolesAccessDirective } from './user-roles-access.directive';
import { AuthService } from 'core/auth/auth.service';

@Component({
  template: `
    <div id="adminContent" *appUserRolesAccess="['SystemAdmin']">Admin Area</div>
    <div id="operatorContent" *appUserRolesAccess="['Operator']">Operator Area</div>
  `,
  standalone: true,
  imports: [UserRolesAccessDirective],
})
class TestHostComponent {}

describe('UserRolesAccessDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockAuthService: { hasRole: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAuthService = {
      hasRole: vi.fn((role: string | string[]) => {
        const r = Array.isArray(role) ? role[0] : role;
        return r === 'SystemAdmin';
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render content when user has matching role', () => {
    const adminEl = fixture.debugElement.query(By.css('#adminContent'));
    expect(adminEl).not.toBeNull();
    expect(adminEl.nativeElement.textContent).toBe('Admin Area');
  });

  it('should not render content when user lacks required role', () => {
    const operatorEl = fixture.debugElement.query(By.css('#operatorContent'));
    expect(operatorEl).toBeNull();
  });
});
