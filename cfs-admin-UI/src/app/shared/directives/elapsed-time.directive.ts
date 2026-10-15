import { Directive, effect, ElementRef, inject, input, OnDestroy, signal } from '@angular/core';

@Directive({
  selector: '[appElapsedTime]',
  standalone: true,
})
export class ElapsedTimeDirective implements OnDestroy {
  public readonly appElapsedTime = input<Date | string | number | null>(null);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly elapsedText = signal<string>('-');

  constructor() {
    effect(() => {
      const dateValue = this.appElapsedTime();
      this.clearInterval();
      this.updateElapsedTime(dateValue);
      this.startInterval(dateValue);
    });

    effect(() => {
      this.elementRef.nativeElement.textContent = this.elapsedText();
    });
  }

  public ngOnDestroy(): void {
    this.clearInterval();
  }

  private startInterval(dateValue: Date | string | number | null): void {
    if (!dateValue) return;
    this.intervalId = setInterval(() => this.updateElapsedTime(dateValue), 60000);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateElapsedTime(dateValue: Date | string | number | null): void {
    if (!dateValue) {
      this.elapsedText.set('-');
      return;
    }

    const timestamp = new Date(dateValue).getTime();
    if (isNaN(timestamp)) {
      this.elapsedText.set('-');
      return;
    }

    const now = Date.now();
    const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));

    if (diffSeconds < 60) {
      this.elapsedText.set('Just now');
      return;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      this.elapsedText.set(`${diffMinutes}m ago`);
      return;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      this.elapsedText.set(`${diffHours}h ago`);
      return;
    }

    const diffDays = Math.floor(diffHours / 24);
    this.elapsedText.set(`${diffDays}d ago`);
  }
}
