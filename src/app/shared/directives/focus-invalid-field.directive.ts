import { Directive, HostListener, inject, input, Renderer2 } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormFocusInvalidFieldService } from '../services/form-focus-invalid-field.service';

@Directive({
  selector: '[appFocusInvalidField]',
  standalone: true,
})
export class FocusInvalidFieldDirective {
  public readonly appFocusInvalidField = input<FormGroup | null | undefined>(undefined);

  private readonly renderer = inject(Renderer2);
  private readonly focusInvalidFieldsService = inject(FormFocusInvalidFieldService);

  @HostListener('click')
  public onClick(): void {
    const form = this.appFocusInvalidField();
    if (form) {
      this.focusInvalidFieldsService.setForm(form, this.renderer).validateFields();
    }
  }
}
