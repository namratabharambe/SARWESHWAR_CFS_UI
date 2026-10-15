import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Renderer2 } from '@angular/core';
import { FormFocusInvalidFieldService } from './form-focus-invalid-field.service';

describe('FormFocusInvalidFieldService', () => {
  let service: FormFocusInvalidFieldService;
  let mockRenderer: Renderer2;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormFocusInvalidFieldService],
    });
    service = TestBed.inject(FormFocusInvalidFieldService);
    mockRenderer = {
      selectRootElement: vi.fn(),
    } as unknown as Renderer2;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not throw when form is valid', () => {
    const form = new FormGroup({
      name: new FormControl('Valid Name', Validators.required),
    });
    service.setForm(form, mockRenderer);
    expect(() => service.validateFields()).not.toThrow();
  });

  it('should mark invalid control as touched', () => {
    const form = new FormGroup({
      name: new FormControl('', Validators.required),
    });
    service.setForm(form, mockRenderer);
    service.validateFields();
    expect(form.get('name')?.touched).toBe(true);
  });
});
