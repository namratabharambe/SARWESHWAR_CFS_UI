import { InjectionToken } from '@angular/core';
import { environment } from 'environment/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => environment.apiBaseUrl });
export const GATE_API_BASE_URL = new InjectionToken<string>('GATE_API_BASE_URL', { factory: () => environment.gateApiBaseUrl });
