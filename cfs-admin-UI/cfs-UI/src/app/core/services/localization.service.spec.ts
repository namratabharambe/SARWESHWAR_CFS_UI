import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LocalizationService } from './localization.service';

describe('LocalizationService', () => {
  let service: LocalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalizationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocalizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default language as en', () => {
    expect(service.currentLang()).toBe('en');
  });

  it('should translate known keys', () => {
    const result = service.translate('NAV.DASHBOARD');
    expect(result).toBe('Dashboard');
  });

  it('should return the key if translation is missing', () => {
    const result = service.translate('NON_EXISTENT.KEY');
    expect(result).toBe('NON_EXISTENT.KEY');
  });

  it('should interpolate parameters', () => {
    const result = service.translate('COMMON.SEARCH', { query: 'test' });
    expect(result).toBe('Search...');
  });
});
