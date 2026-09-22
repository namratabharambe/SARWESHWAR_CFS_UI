import { Injectable, Renderer2 } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FormFocusInvalidFieldService {
  private renderer?: Renderer2;
  private form?: FormGroup;

  public setForm(formToCheck: FormGroup | undefined, renderer: Renderer2): FormFocusInvalidFieldService {
    if (formToCheck) {
      this.form = formToCheck;
    }
    this.renderer = renderer;
    return this;
  }

  public validateFields(): void {
    if (!this.form || this.form.valid) {
      return;
    }

    const invalidField = Object.keys(this.form.controls).find((field) => this.form?.controls[field]?.invalid);

    if (invalidField) {
      this.form.get(invalidField)?.markAsTouched();

      try {
        const element = this.findInvalidFieldElement(invalidField);
        if (!element) {
          console.warn('Unable to focus on invalid field:', invalidField);
          return;
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.getFocusTarget(element).focus();
      } catch (err) {
        console.warn('Unable to focus on invalid field:', invalidField, err);
      }
    }
  }

  private findInvalidFieldElement(invalidField: string): HTMLElement | null {
    if (!this.renderer) return null;
    try {
      return this.renderer.selectRootElement(`[data-control-name="${invalidField}"]`, true);
    } catch {
      try {
        return this.renderer.selectRootElement(`[formcontrolname="${invalidField}"]`, true);
      } catch {
        try {
          return this.renderer.selectRootElement('.has-error, .border-red-500, .mat-form-field-invalid', true);
        } catch {
          return null;
        }
      }
    }
  }

  private getFocusTarget(element: HTMLElement): HTMLElement {
    const focusable = element.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    return focusable ?? element;
  }
}
