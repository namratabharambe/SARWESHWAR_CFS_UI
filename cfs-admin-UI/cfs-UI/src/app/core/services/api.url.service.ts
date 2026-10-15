import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';

@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  public get apiUrl(): string {
    const raw = (environment.apiBaseUrl ?? '/admin/api').replace(/\/+$/, '');
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        try {
          const parsed = new URL(raw);
          return parsed.pathname.replace(/\/+$/, '');
        } catch {
          return raw;
        }
      }
    }
    return raw;
  }
}
