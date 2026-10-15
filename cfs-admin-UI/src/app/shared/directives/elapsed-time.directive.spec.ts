import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ElapsedTimeDirective } from './elapsed-time.directive';

@Component({
  template: ` <span id="elapsed" [appElapsedTime]="testDate()"></span> `,
  standalone: true,
  imports: [ElapsedTimeDirective],
})
class TestHostComponent {
  public testDate = signal<Date | null>(new Date());
}

describe('ElapsedTimeDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render "Just now" for current timestamp', () => {
    const el = fixture.debugElement.query(By.css('#elapsed')).nativeElement as HTMLElement;
    expect(el.textContent).toBe('Just now');
  });

  it('should render "-" when date is null', () => {
    fixture.componentInstance.testDate.set(null);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('#elapsed')).nativeElement as HTMLElement;
    expect(el.textContent).toBe('-');
  });
});
