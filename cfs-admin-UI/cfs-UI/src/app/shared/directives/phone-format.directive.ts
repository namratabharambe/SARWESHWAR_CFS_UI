import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appPhoneFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneFormatDirective),
      multi: true,
    },
  ],
})
export class PhoneFormatDirective implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  public writeValue(value: string | null | undefined): void {
    const formatted = this.formatForUi(value ?? '');
    this.elementRef.nativeElement.value = formatted;
  }

  public registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  @HostListener('input', ['$event'])
  public onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    const digits = this.sanitizeInput(value);
    const uiValue = this.formatForUi(digits);
    this.elementRef.nativeElement.value = uiValue;
    this.onChange(digits);
  }

  @HostListener('blur')
  public onBlur(): void {
    this.onTouched();
  }

  private formatForUi(value: string): string {
    const digits = this.sanitizeInput(value);
    if (!digits) return '';

    if (digits.length <= 3) {
      return digits;
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  private sanitizeInput(value: string): string {
    return (value || '').replace(/\D/g, '').slice(0, 10);
  }
}
