import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlightText]',
  standalone: true,
})
export class HighlightTextDirective {
  public readonly appHighlightText = input<string>('');
  public readonly highlightTerm = input<string>('');

  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      this.updateHighlightedText();
    });
  }

  private updateHighlightedText(): void {
    const element = this.elementRef.nativeElement;
    const text = this.appHighlightText() || element.textContent || '';
    const term = this.highlightTerm()?.trim();

    if (!term || term.length < 2 || !text) {
      this.renderer.setProperty(element, 'textContent', text);
      return;
    }

    const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
    const highlightedText = text.replace(
      regex,
      '<mark class="bg-amber-200 dark:bg-amber-900/60 text-inherit font-medium rounded-sm px-0.5">$1</mark>',
    );
    this.renderer.setProperty(element, 'innerHTML', highlightedText);
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
