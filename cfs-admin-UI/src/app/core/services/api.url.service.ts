import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';

@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  public readonly apiUrl: string = (environment.apiBaseUrl ?? 'https://api.smartyard.prosperinfotech.com/admin/api').replace(/\/+$/, '');
  public readonly gateApiUrl: string = (environment.gateApiBaseUrl ?? 'https://api.smartyard.prosperinfotech.com/gate/api/v1').replace(/\/+$/, '');
}
