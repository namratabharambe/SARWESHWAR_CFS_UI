import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TouchedOnKeyUpDirective } from './touched-on-key-up.directive';

@Component({
  template: ` <input id="testInput" [formControl]="control" appTouchedOnKeyUp /> `,
  standalone: true,
  imports: [ReactiveFormsModule, TouchedOnKeyUpDirective],
})
class TestHostComponent {
  public control = new FormControl('');
}

describe('TouchedOnKeyUpDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should mark control as touched on keyup', () => {
    const inputEl = fixture.debugElement.query(By.css('#testInput')).nativeElement as HTMLInputElement;
    expect(fixture.componentInstance.control.touched).toBe(false);

    inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.control.touched).toBe(true);
  });
});
