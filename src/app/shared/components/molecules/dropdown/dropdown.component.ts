import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface DropdownOption<T = any> {
  label: string;
  value: T;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

export type RawDropdownOption<T = any> = DropdownOption<T> | string | number;

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true,
    },
  ],
  host: {
    '[class.z-50]': 'isOpen()',
    '[class.is-open]': 'isOpen()',
    '[class.w-full]': 'fullWidth()',
    '[class.relative]': 'true',
  },
})
export class DropdownComponent implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  // Inputs
  public readonly options = input<RawDropdownOption[]>([]);
  public readonly placeholder = input<string>('Select an option');
  public readonly label = input<string>('');
  public readonly disabled = input<boolean>(false);
  public readonly showClear = input<boolean>(false);
  public readonly searchable = input<boolean>(false);
  public readonly fullWidth = input<boolean>(false);
  public readonly customTriggerClass = input<string>('');
  public readonly customMenuClass = input<string>('');
  public readonly size = input<'sm' | 'md' | 'lg'>('md');
  public readonly minMenuWidth = input<string>('');
  public readonly align = input<'left' | 'right'>('left');

  // Value input for one-way or [(value)] binding
  public readonly value = input<any>(undefined);
  public readonly valueChange = output<any>();

  // Internal state
  public readonly isOpen = signal<boolean>(false);
  public readonly internalValue = signal<any>(null);
  public readonly searchQuery = signal<string>('');
  public readonly focusedIndex = signal<number>(-1);
  public readonly isDisabled = signal<boolean>(false);

  // Form Control callbacks
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  // Normalize options to DropdownOption[]
  public readonly normalizedOptions = computed<DropdownOption[]>(() => {
    return this.options().map(opt => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { label: String(opt), value: opt };
      }
      return opt;
    });
  });

  // Filtered options based on search query
  public readonly filteredOptions = computed<DropdownOption[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const opts = this.normalizedOptions();
    if (!q) return opts;
    return opts.filter(o => o.label.toLowerCase().includes(q));
  });

  // Active value resolution (prefers internal value or value input)
  public readonly currentValue = computed<any>(() => {
    const v = this.value();
    if (v !== undefined) return v;
    return this.internalValue();
  });

  // Find currently selected option
  public readonly selectedOption = computed<DropdownOption | undefined>(() => {
    const val = this.currentValue();
    if (val === undefined || val === null || val === '') return undefined;
    return this.normalizedOptions().find(o => o.value === val || String(o.value) === String(val));
  });

  // Display label
  public readonly displayLabel = computed<string>(() => {
    const sel = this.selectedOption();
    if (sel) return sel.label;
    const val = this.currentValue();
    if (val !== undefined && val !== null && val !== '') {
      return String(val);
    }
    return this.placeholder();
  });

  public readonly hasValue = computed<boolean>(() => {
    const val = this.currentValue();
    return val !== undefined && val !== null && val !== '';
  });

  public isSelected(opt: DropdownOption | any): boolean {
    if (!opt) return false;
    const val = this.currentValue();
    if (val === undefined || val === null || val === '') return false;
    const optVal = typeof opt === 'object' && opt !== null && 'value' in opt ? opt.value : opt;
    return val === optVal || String(val) === String(optVal);
  }

  // Auto-enable search if option count > 8 unless explicitly configured
  public readonly isSearchVisible = computed<boolean>(() => {
    return this.searchable() || this.normalizedOptions().length > 8;
  });

  constructor() {
    // Sync external value input changes to internalValue
    effect(() => {
      const v = this.value();
      if (v !== undefined) {
        this.internalValue.set(v);
      }
    });

    // Sync disabled input
    effect(() => {
      this.isDisabled.set(this.disabled());
    });
  }

  // ControlValueAccessor methods
  public writeValue(val: any): void {
    this.internalValue.set(val);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // Interaction handlers
  public toggle(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (this.isDisabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  public open(): void {
    if (this.isDisabled()) return;
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.focusedIndex.set(-1);
  }

  public close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.onTouched();
  }

  public selectOption(opt: DropdownOption, event?: Event): void {
    event?.stopPropagation();
    if (opt.disabled) return;
    this.internalValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.close();
  }

  public clear(event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled()) return;
    this.internalValue.set('');
    this.onChange('');
    this.valueChange.emit('');
  }

  public onSearchInput(event: Event): void {
    event.stopPropagation();
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.focusedIndex.set(0);
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;

    if (!this.isOpen()) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    const opts = this.filteredOptions();
    if (opts.length === 0) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (this.focusedIndex() + 1) % opts.length;
      this.focusedIndex.set(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = this.focusedIndex() <= 0 ? opts.length - 1 : this.focusedIndex() - 1;
      this.focusedIndex.set(prev);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.focusedIndex();
      if (idx >= 0 && idx < opts.length) {
        this.selectOption(opts[idx]);
      } else if (opts.length === 1) {
        this.selectOption(opts[0]);
      }
    } else if (event.key === 'Tab') {
      this.close();
    }
  }
}
