import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  host: {
    '[class.z-50]': 'isOpen()',
    '[class.is-open]': 'isOpen()',
  },
})
export class DatePickerComponent {
  private readonly elementRef = inject(ElementRef);

  // Model binding
  public readonly value = model<string>('');

  // Configurable inputs
  public readonly placeholder = input<string>('Select Date');
  public readonly mode = input<'date' | 'datetime'>('date');
  public readonly format = input<'display' | 'iso' | 'dmy'>('display');
  public readonly disabled = input<boolean>(false);
  public readonly showClear = input<boolean>(true);
  public readonly label = input<string>('');
  public readonly customTriggerClass = input<string>('');

  // Dropdown visibility
  public readonly isOpen = signal<boolean>(false);

  // Calendar navigation state
  public readonly viewDate = signal<Date>(new Date());
  public readonly selectedDate = signal<Date | null>(null);

  // Time state for datetime mode
  public readonly selectedHour = signal<string>('12');
  public readonly selectedMinute = signal<string>('00');
  public readonly selectedPeriod = signal<'AM' | 'PM'>('PM');

  public readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  public readonly shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  public readonly weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  public readonly currentMonthName = computed<string>(() => {
    return this.monthNames[this.viewDate().getMonth()];
  });

  public readonly currentYear = computed<number>(() => {
    return this.viewDate().getFullYear();
  });

  // Generate calendar days grid (Mon-Sun)
  public readonly calendarDays = computed<CalendarDay[]>(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is index 0 in our week: Mon=0, Tue=1, ..., Sun=6
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex < 0) startDayIndex = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sel = this.selectedDate();
    const selectedNormalized = sel ? new Date(sel.getFullYear(), sel.getMonth(), sel.getDate()).getTime() : null;

    // Previous month padding days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: selectedNormalized !== null && d.getTime() === selectedNormalized,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        isSelected: selectedNormalized !== null && d.getTime() === selectedNormalized,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    const totalCellsNeeded = days.length + remaining < 35 ? 35 - days.length : remaining;

    for (let i = 1; i <= totalCellsNeeded; i++) {
      const d = new Date(year, month + 1, i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: selectedNormalized !== null && d.getTime() === selectedNormalized,
      });
    }

    return days;
  });

  constructor() {
    // Sync external model value to internal state
    effect(() => {
      const val = this.value();
      if (!val) {
        this.selectedDate.set(null);
        return;
      }

      const parsed = this.parseDateString(val);
      if (parsed && !isNaN(parsed.getTime())) {
        this.selectedDate.set(parsed);
        this.viewDate.set(new Date(parsed.getFullYear(), parsed.getMonth(), 1));

        if (this.mode() === 'datetime') {
          let hours = parsed.getHours();
          const period = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          this.selectedHour.set(hours.toString().padStart(2, '0'));
          this.selectedMinute.set(parsed.getMinutes().toString().padStart(2, '0'));
          this.selectedPeriod.set(period);
        }
      }
    });
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  public onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  public toggle(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open(event);
    }
  }

  public open(event?: Event): void {
    event?.stopPropagation();
    if (this.disabled()) return;
    const sel = this.selectedDate();
    if (sel) {
      this.viewDate.set(new Date(sel.getFullYear(), sel.getMonth(), 1));
    }
    this.isOpen.set(true);
  }

  public close(): void {
    this.isOpen.set(false);
  }

  public prevMonth(event?: MouseEvent): void {
    event?.stopPropagation();
    const curr = this.viewDate();
    this.viewDate.set(new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
  }

  public nextMonth(event?: MouseEvent): void {
    event?.stopPropagation();
    const curr = this.viewDate();
    this.viewDate.set(new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
  }

  public selectDay(day: CalendarDay, event?: MouseEvent): void {
    event?.stopPropagation();
    const d = new Date(day.date);

    if (this.mode() === 'datetime') {
      let h = parseInt(this.selectedHour(), 10) || 12;
      if (this.selectedPeriod() === 'PM' && h < 12) h += 12;
      if (this.selectedPeriod() === 'AM' && h === 12) h = 0;
      const m = parseInt(this.selectedMinute(), 10) || 0;
      d.setHours(h, m, 0, 0);
      this.selectedDate.set(d);
      this.updateFormattedValue(d);
    } else {
      d.setHours(0, 0, 0, 0);
      this.selectedDate.set(d);
      this.updateFormattedValue(d);
      this.close();
    }
  }

  public updateTime(): void {
    const sel = this.selectedDate() || new Date();
    const d = new Date(sel);
    let h = parseInt(this.selectedHour(), 10) || 12;
    if (this.selectedPeriod() === 'PM' && h < 12) h += 12;
    if (this.selectedPeriod() === 'AM' && h === 12) h = 0;
    const m = parseInt(this.selectedMinute(), 10) || 0;
    d.setHours(h, m, 0, 0);
    this.selectedDate.set(d);
    this.updateFormattedValue(d);
  }

  public setToday(event?: MouseEvent): void {
    event?.stopPropagation();
    const now = new Date();
    this.viewDate.set(new Date(now.getFullYear(), now.getMonth(), 1));

    if (this.mode() === 'datetime') {
      this.selectedDate.set(now);
      let hours = now.getHours();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      this.selectedHour.set(hours.toString().padStart(2, '0'));
      this.selectedMinute.set(now.getMinutes().toString().padStart(2, '0'));
      this.selectedPeriod.set(period);
      this.updateFormattedValue(now);
    } else {
      now.setHours(0, 0, 0, 0);
      this.selectedDate.set(now);
      this.updateFormattedValue(now);
      this.close();
    }
  }

  public clear(event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectedDate.set(null);
    this.value.set('');
    this.close();
  }

  public applyDateTime(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.selectedDate()) {
      this.setToday();
    } else {
      this.updateTime();
    }
    this.close();
  }

  private updateFormattedValue(date: Date): void {
    const day = date.getDate().toString().padStart(2, '0');
    const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
    const shortMonth = this.shortMonthNames[date.getMonth()];
    const year = date.getFullYear();

    if (this.mode() === 'datetime') {
      const hours24 = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      // Format: dd-mm-yyyy hh:mm or display
      if (this.format() === 'dmy') {
        this.value.set(`${day}-${monthNum}-${year} ${hours24}:${minutes}`);
      } else {
        const hours12 = (date.getHours() % 12 || 12).toString().padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        this.value.set(`${day} ${shortMonth} ${year}, ${hours12}:${minutes} ${ampm}`);
      }
      return;
    }

    if (this.format() === 'iso') {
      this.value.set(`${year}-${monthNum}-${day}`);
    } else if (this.format() === 'dmy') {
      this.value.set(`${day}-${monthNum}-${year}`);
    } else {
      // Default display format: "17 May 2025"
      this.value.set(`${day} ${shortMonth} ${year}`);
    }
  }

  private parseDateString(str: string): Date | null {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();

    // Try parsing standard JS date string
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Try parsing 'DD MMM YYYY' (e.g. '17 May 2025')
    const displayMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
    if (displayMatch) {
      const day = parseInt(displayMatch[1], 10);
      const mStr = displayMatch[2].slice(0, 3).toLowerCase();
      const mIdx = this.shortMonthNames.findIndex(m => m.toLowerCase() === mStr);
      const year = parseInt(displayMatch[3], 10);
      if (mIdx >= 0) {
        return new Date(year, mIdx, day);
      }
    }

    // Try parsing 'DD-MM-YYYY' or 'DD-MM-YYYY HH:mm'
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      return new Date(year, month, day, hour, min);
    }

    // Try parsing 'YYYY-MM-DD'
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      return new Date(year, month, day);
    }

    return null;
  }
}
