import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FocusInvalidFieldDirective } from './focus-invalid-field.directive';
import { FormFocusInvalidFieldService } from '../services/form-focus-invalid-field.service';

@Component({
  template: `
    <form [formGroup]="testForm">
      <button id="submitBtn" [appFocusInvalidField]="testForm">Submit</button>
    </form>
  `,
  standalone: true,
  imports: [ReactiveFormsModule, FocusInvalidFieldDirective],
})
class TestHostComponent {
  public testForm = new FormGroup({
    field: new FormControl('', Validators.required),
  });
}

describe('FocusInvalidFieldDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockFocusService: { setForm: ReturnType<typeof vi.fn>; validateFields: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockFocusService = {
      setForm: vi.fn().mockReturnThis(),
      validateFields: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: FormFocusInvalidFieldService, useValue: mockFocusService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should call validateFields on button click', () => {
    const button = fixture.debugElement.query(By.css('#submitBtn'));
    button.nativeElement.click();
    expect(mockFocusService.setForm).toHaveBeenCalled();
    expect(mockFocusService.validateFields).toHaveBeenCalled();
  });
});
