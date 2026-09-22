import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { UppercaseDirective } from './uppercase.directive';

@Component({
  template: ` <input id="code" [formControl]="control" [appUppercase]="true" /> `,
  standalone: true,
  imports: [ReactiveFormsModule, UppercaseDirective],
})
class TestHostComponent {
  public control = new FormControl('');
}

describe('UppercaseDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should transform lowercase input to uppercase', () => {
    const inputEl = fixture.debugElement.query(By.css('#code')).nativeElement as HTMLInputElement;
    inputEl.value = 'cfs101';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(inputEl.value).toBe('CFS101');
  });
});
