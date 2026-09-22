import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appTouchedOnKeyUp]',
  standalone: true,
})
export class TouchedOnKeyUpDirective {
  private readonly ngControl = inject(NgControl, { optional: true });

  @HostListener('keyup')
  public onKeyUp(): void {
    if (this.ngControl?.control && !this.ngControl.control.touched) {
      this.ngControl.control.markAsTouched();
    }
  }
}
