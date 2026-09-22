import { Directive, ElementRef, HostListener, inject, input, OnInit } from '@angular/core';

@Directive({
  selector: '[appUppercase]',
  standalone: true,
})
export class UppercaseDirective implements OnInit {
  public readonly appUppercase = input<boolean>(true);

  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  public ngOnInit(): void {
    if (this.appUppercase()) {
      this.elementRef.nativeElement.style.textTransform = 'uppercase';
    }
  }

  @HostListener('input', ['$event'])
  public onInput(event: Event): void {
    if (!this.appUppercase()) return;

    const input = event.target as HTMLInputElement;
    if (!input || typeof input.value !== 'string') return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const upper = input.value.toUpperCase();

    if (input.value !== upper) {
      input.value = upper;
      if (start !== null && end !== null) {
        input.setSelectionRange(start, end);
      }
      // Re-dispatch input event for Angular FormControl binding
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
