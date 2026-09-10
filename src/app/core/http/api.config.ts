import { InjectionToken } from '@angular/core';
import { environment } from 'environment/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => environment.apiBaseUrl });
