import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem('cfs_theme_mode');
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.removeAttribute('data-mode');

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem('cfs_theme_mode');
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.removeAttribute('data-mode');
  });

  it('should create ThemeService', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle theme when toggleTheme is called', () => {
    const initial = service.isDarkMode();
    service.toggleTheme();
    expect(service.isDarkMode()).toBe(!initial);

    service.toggleTheme();
    expect(service.isDarkMode()).toBe(initial);
  });

  it('should set dark mode on documentElement and body when setDarkMode(true)', () => {
    service.setDarkMode(true);
    expect(service.isDarkMode()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
  });

  it('should remove dark mode from documentElement and body when setDarkMode(false)', () => {
    service.setDarkMode(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.setDarkMode(false);
    expect(service.isDarkMode()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.body.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-mode')).toBe('light');
  });
});
