import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'cfs_theme_mode';
  public readonly isDarkMode = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = saved ? saved === 'dark' : prefersDark;
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
    this.isDarkMode.update((dark) => !dark);
  }

  public setDarkMode(enabled: boolean): void {
    this.isDarkMode.set(enabled);
  }

  private applyTheme(dark: boolean): void {
    if (typeof document === 'undefined') return;
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-mode', 'light');
    }
  }
}
