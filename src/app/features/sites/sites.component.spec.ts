import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SitesComponent } from './sites.component';
import { AdminRepository } from 'core/data/admin.repository';
import { AuthService } from 'core/auth/auth.service';
import { MockAdminRepository, MockAuthService } from 'shared/utility/test-mocks';

describe('SitesComponent', () => {
  let component: SitesComponent;
  let fixture: ComponentFixture<SitesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesComponent],
      providers: [
        provideRouter([]),
        { provide: AdminRepository, useClass: MockAdminRepository },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
