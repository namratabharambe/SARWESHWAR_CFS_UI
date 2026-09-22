import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfidenceBadgeComponent } from './confidence-badge.component';

describe('ConfidenceBadgeComponent', () => {
  let component: ConfidenceBadgeComponent;
  let fixture: ComponentFixture<ConfidenceBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfidenceBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfidenceBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate high level for >= 95', () => {
    fixture.componentRef.setInput('confidence', 98);
    expect(component.level()).toBe('high');
  });

  it('should calculate med level for 90-94', () => {
    fixture.componentRef.setInput('confidence', 92);
    expect(component.level()).toBe('med');
  });

  it('should calculate low level for < 90', () => {
    fixture.componentRef.setInput('confidence', 84);
    expect(component.level()).toBe('low');
  });
});
