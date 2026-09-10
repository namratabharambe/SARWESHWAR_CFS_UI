import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CenteredDividerComponent } from './centered-divider.component';

describe('CenteredDividerComponent', () => {
  let component: CenteredDividerComponent;
  let fixture: ComponentFixture<CenteredDividerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CenteredDividerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CenteredDividerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label when provided', () => {
    fixture.componentRef.setInput('label', 'Site Roles');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('Site Roles');
  });
});
