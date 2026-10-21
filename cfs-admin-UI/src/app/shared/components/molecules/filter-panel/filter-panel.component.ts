import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { DropdownComponent, DropdownOption } from '../dropdown/dropdown.component';

export interface FilterField {
  key: string;
  label: string;
  /** 'daterange' stores its values under `${key}From` and `${key}To`. */
  type: 'date' | 'daterange' | 'text' | 'select';
  placeholder?: string;
  options?: DropdownOption<string>[];
}

export type FilterValues = Record<string, string>;

export interface FilterApplyEvent {
  values: FilterValues;
  sort: string;
}

/**
 * Funnel button + panel with filter fields and a "Sort by" choice, plus a Clear button once filters are applied.
 * Edits are drafted in the panel and only emitted on Apply, so the list doesn't reload on every keystroke.
 * The open panel is moved to <body> so no card, header or animated page wrapper can clip or cover it.
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [FormsModule, DatePickerComponent, DropdownComponent],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanelComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  public readonly fields = input.required<FilterField[]>();
  public readonly sortOptions = input<DropdownOption<string>[]>([]);
  /** Currently applied values and sort (the page owns them). */
  public readonly values = input<FilterValues>({});
  public readonly sort = input<string>('');
  public readonly defaultSort = input<string>('');

  public readonly apply = output<FilterApplyEvent>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    // The panel is fixed to the screen, so close it when the page scrolls the button away.
    const onScroll = (e: Event) => {
      if (this.open() && !this.inside(e.target as Node)) this.open.set(false);
    };
    document.addEventListener('scroll', onScroll, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('scroll', onScroll, true));

    // When the panel renders: move it to <body>, then place it under the button, kept fully on screen.
    effect(() => {
      const el = this.panel()?.nativeElement;
      if (!el) return;
      document.body.appendChild(el);
      const btn = this.host.nativeElement.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const margin = 12;
      const left = Math.min(Math.max(margin, btn.left), window.innerWidth - w - margin);
      const below = btn.bottom + 8;
      // Not enough room below? Shift up so the whole panel (and its Apply button) stays visible.
      const top = Math.max(margin, Math.min(below, window.innerHeight - h - margin));
      this.pos.set({ top, left });
    });
  }

  public readonly open = signal<boolean>(false);
  public readonly draft = signal<FilterValues>({});
  public readonly draftSort = signal<string>('');
  /** Screen position of the panel (fixed, measured once it renders). */
  public readonly pos = signal<{ top: number; left: number }>({ top: -9999, left: 0 });

  /** Number of applied filters, plus one when the sort differs from the default. */
  public readonly activeCount = computed<number>(() => {
    const filters = Object.values(this.values()).filter((v) => v && v !== 'All').length;
    return filters + (this.sort() && this.sort() !== this.defaultSort() ? 1 : 0);
  });

  public toggle(): void {
    if (!this.open()) {
      this.pos.set({ top: -9999, left: 0 }); // hidden off-screen until measured
      this.draft.set({ ...this.values() });
      this.draftSort.set(this.sort() || this.defaultSort());
    }
    this.open.update((v) => !v);
  }

  public set(key: string, value: string): void {
    this.draft.update((d) => {
      const next = { ...d, [key]: value ?? '' };
      // A single date and a date range can't both apply: picking one clears the other.
      if (value) {
        for (const f of this.fields()) {
          if (f.type === 'date' && this.isRangeKey(key)) next[f.key] = '';
          if (f.type === 'daterange' && this.isDateKey(key)) {
            next[`${f.key}From`] = '';
            next[`${f.key}To`] = '';
          }
        }
      }
      return next;
    });
  }

  private isRangeKey(key: string): boolean {
    return this.fields().some((f) => f.type === 'daterange' && (key === `${f.key}From` || key === `${f.key}To`));
  }

  private isDateKey(key: string): boolean {
    return this.fields().some((f) => f.type === 'date' && key === f.key);
  }

  public onApply(): void {
    this.apply.emit({ values: this.clean(this.draft()), sort: this.draftSort() });
    this.open.set(false);
  }

  public onReset(): void {
    this.draft.set({});
    this.draftSort.set(this.defaultSort());
    this.apply.emit({ values: {}, sort: this.defaultSort() });
    this.open.set(false);
  }

  /** Clears every applied filter and the sort in one click. */
  public clearAll(): void {
    this.onReset();
  }

  private inside(node: Node | null): boolean {
    return !!node && (this.host.nativeElement.contains(node) || !!this.panel()?.nativeElement.contains(node));
  }

  private clean(v: FilterValues): FilterValues {
    return Object.fromEntries(Object.entries(v).filter(([, val]) => val && val !== 'All').map(([k, val]) => [k, val.trim()]));
  }

  @HostListener('document:mousedown', ['$event'])
  public onOutside(e: MouseEvent): void {
    // Date-picker and dropdown menus live inside the panel, so only clicks fully outside close it.
    if (this.open() && !this.inside(e.target as Node)) this.open.set(false);
  }

  @HostListener('window:resize')
  public onResize(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  public onEsc(): void {
    this.open.set(false);
  }
}
