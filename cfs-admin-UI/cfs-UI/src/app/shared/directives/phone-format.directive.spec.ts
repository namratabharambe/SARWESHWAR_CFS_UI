import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { PhoneFormatDirective } from './phone-format.directive';

@Component({
  template: ` <input id="phone" [formControl]="control" appPhoneFormat /> `,
  standalone: true,
  imports: [ReactiveFormsModule, PhoneFormatDirective],
})
class TestHostComponent {
  public control = new FormControl('');
}

describe('PhoneFormatDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should format 10 digits as (XXX) XXX-XXXX', () => {
    const inputEl = fixture.debugElement.query(By.css('#phone')).nativeElement as HTMLInputElement;
    inputEl.value = '5551234567';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(inputEl.value).toBe('(555) 123-4567');
    expect(fixture.componentInstance.control.value).toBe('5551234567');
  });
});
