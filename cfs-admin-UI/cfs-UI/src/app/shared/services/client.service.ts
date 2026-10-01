import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from 'shared/services/base-api.service';
import { ApiUrlService } from 'core/services/api.url.service';
import { Client, CreateClientRequest, UpdateClientRequest } from 'shared/types/client/client.interface';

@Injectable({ providedIn: 'root' })
export class ClientService extends BaseApiService<Client[], Client, CreateClientRequest | UpdateClientRequest> {
  constructor(http: HttpClient) {
    super(http, inject(ApiUrlService).apiUrl);
  }

  public override controllerName(): string {
    return 'clients';
  }

  public listClients(): Observable<Client[]> {
    return this.get();
  }

  public createClient(request: CreateClientRequest): Observable<Client> {
    const payload = {
      Name: request.Name ?? request.name,
    };
    return this.http.post<Client>(this.endpointUrl, payload);
  }

  public updateClient(id: string, request: UpdateClientRequest): Observable<Client> {
    const payload = {
      Name: request.Name ?? request.name,
    };
    return this.http.put<Client>(`${this.endpointUrl}/${id}`, payload);
  }

  public setActive(id: string, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.endpointUrl}/${id}/active/${active}`, {});
  }
}
