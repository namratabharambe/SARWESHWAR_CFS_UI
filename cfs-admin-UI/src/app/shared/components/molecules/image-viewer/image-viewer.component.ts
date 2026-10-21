import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { GateCameraPhoto } from '../gate-photo-strip/gate-photo-strip.component';

/**
 * Full-screen image gallery with previous / next / close, thumbnails and an in-app "Full Size" mode.
 * The host element is moved to <body> so no page header, sticky panel or transformed parent can cover it.
 */
@Component({
  selector: 'app-image-viewer',
  standalone: true,
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerComponent implements OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private previousOverflow = '';

  public readonly photos = input.required<GateCameraPhoto[]>();
  public readonly startIndex = input<number>(0);
  /** Shown under the photo label, e.g. the container or truck number. */
  public readonly title = input<string>('');
  public readonly closed = output<void>();

  public readonly index = signal<number>(0);
  public readonly fullSize = signal<boolean>(false);

  public readonly current = computed<GateCameraPhoto | null>(() => this.photos()[this.index()] ?? null);
  public readonly hasMany = computed<boolean>(() => this.photos().length > 1);

  public ngOnInit(): void {
    const count = this.photos().length;
    this.index.set(count ? Math.min(Math.max(this.startIndex(), 0), count - 1) : 0);
    this.document.body.appendChild(this.host.nativeElement);
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
  }

  public ngOnDestroy(): void {
    this.document.body.style.overflow = this.previousOverflow;
    this.host.nativeElement.remove();
  }

  public prev(e?: Event): void {
    e?.stopPropagation();
    const n = this.photos().length;
    if (n > 1) this.index.update((i) => (i - 1 + n) % n);
  }

  public next(e?: Event): void {
    e?.stopPropagation();
    const n = this.photos().length;
    if (n > 1) this.index.update((i) => (i + 1) % n);
  }

  public select(i: number, e?: Event): void {
    e?.stopPropagation();
    this.index.set(i);
  }

  public toggleFullSize(e?: Event): void {
    e?.stopPropagation();
    this.fullSize.update((v) => !v);
  }

  public close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  public onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') this.prev();
    else if (e.key === 'ArrowRight') this.next();
    else if (e.key === 'Escape') {
      e.stopPropagation();
      // Esc leaves Full Size first, then closes.
      if (this.fullSize()) this.fullSize.set(false);
      else this.close();
    }
  }
}
