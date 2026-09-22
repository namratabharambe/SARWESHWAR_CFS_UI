import { Directive, forwardRef, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appDuplicateName]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DuplicateNameDirective),
      multi: true,
    },
  ],
})
export class DuplicateNameDirective implements Validator {
  public readonly appDuplicateName = input<string[]>([]);
  public readonly duplicateErrorKey = input<string>('duplicateName');

  public validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim().toLowerCase();
    const list = this.appDuplicateName().map((n) => (n || '').trim().toLowerCase());

    const isDuplicate = list.includes(trimmed);
    return isDuplicate ? { [this.duplicateErrorKey()]: true } : null;
  }
}
