import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'cfs_theme_mode';
  public readonly isDarkMode = signal<boolean>(false);

  constructor() {
    let initialDark = false;
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      const prefersDark =
        typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      initialDark = saved ? saved === 'dark' : !!prefersDark;
    }
    this.isDarkMode.set(initialDark);
    this.applyTheme(initialDark);

    effect(() => {
      const dark = this.isDarkMode();
      this.applyTheme(dark);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, dark ? 'dark' : 'light');
      }
    });
  }

  public toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.applyTheme(next);
  }

  public setDarkMode(enabled: boolean): void {
    this.isDarkMode.set(enabled);
    this.applyTheme(enabled);
  }

  private applyTheme(dark: boolean): void {
    if (typeof document === 'undefined') return;
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body?.classList.add('dark');
      document.documentElement.setAttribute('data-mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body?.classList.remove('dark');
      document.documentElement.setAttribute('data-mode', 'light');
    }
  }
}
