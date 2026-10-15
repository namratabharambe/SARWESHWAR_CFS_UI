import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute two-letter initials correctly from full name', () => {
    fixture.componentRef.setInput('name', 'John Doe');
    fixture.detectChanges();
    expect(component.initials()).toBe('JD');
  });

  it('should handle single name fallback', () => {
    fixture.componentRef.setInput('name', 'Admin');
    fixture.detectChanges();
    expect(component.initials()).toBe('AD');
  });
});
