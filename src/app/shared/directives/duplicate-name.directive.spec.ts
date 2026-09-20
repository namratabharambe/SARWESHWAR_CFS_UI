import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DuplicateNameDirective } from './duplicate-name.directive';

@Component({
  template: ` <input id="nameInput" [formControl]="control" [appDuplicateName]="existingList" /> `,
  standalone: true,
  imports: [ReactiveFormsModule, DuplicateNameDirective],
})
class TestHostComponent {
  public existingList = ['Apple', 'Banana', 'Orange'];
  public control = new FormControl('');
}

describe('DuplicateNameDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should flag duplicate names ignoring case', () => {
    fixture.componentInstance.control.setValue('banana');
    fixture.detectChanges();

    expect(fixture.componentInstance.control.hasError('duplicateName')).toBe(true);
  });

  it('should be valid when name is unique', () => {
    fixture.componentInstance.control.setValue('Grape');
    fixture.detectChanges();

    expect(fixture.componentInstance.control.errors).toBeNull();
  });
});
