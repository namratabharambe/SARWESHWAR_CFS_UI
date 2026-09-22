import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslatePipe } from './translate.pipe';
import { LocalizationService } from 'core/services/localization.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let service: LocalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalizationService, TranslatePipe, provideHttpClient(), provideHttpClientTesting()],
    });
    pipe = TestBed.inject(TranslatePipe);
    service = TestBed.inject(LocalizationService);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform key using localization service', () => {
    const result = pipe.transform('NAV.DASHBOARD');
    expect(result).toBe('Dashboard');
  });

  it('should return empty string for empty key', () => {
    expect(pipe.transform('')).toBe('');
  });
});
