import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create DatePickerComponent', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('should toggle open and closed state', () => {
    component.toggle();
    expect(component.isOpen()).toBe(true);

    component.toggle();
    expect(component.isOpen()).toBe(false);
  });

  it('should navigate to next and previous month', () => {
    const initialMonth = component.viewDate().getMonth();
    component.nextMonth();
    expect(component.viewDate().getMonth()).toBe((initialMonth + 1) % 12);

    component.prevMonth();
    expect(component.viewDate().getMonth()).toBe(initialMonth);
  });

  it('should select today when setToday is called', () => {
    component.setToday();
    expect(component.value()).toBeTruthy();
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, '0');
    expect(component.value()).toContain(dayStr);
  });

  it('should clear value when clear is called', () => {
    component.setToday();
    expect(component.value()).toBeTruthy();

    component.clear();
    expect(component.value()).toBe('');
    expect(component.isOpen()).toBe(false);
  });

  it('should format datetime when mode is datetime', () => {
    fixture.componentRef.setInput('mode', 'datetime');
    component.setToday();
    expect(component.value()).toMatch(/AM|PM/);
  });
});
