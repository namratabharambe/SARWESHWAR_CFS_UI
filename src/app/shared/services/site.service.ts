import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { BaseApiService } from 'shared/services/base-api.service';
import { ApiUrlService } from 'core/services/api.url.service';
import { Site, CreateSiteRequest, UpdateSiteRequest } from 'shared/types/site/site.interface';

@Injectable({ providedIn: 'root' })
export class SiteService extends BaseApiService<Site[], Site, CreateSiteRequest | UpdateSiteRequest> {
  constructor(http: HttpClient) {
    super(http, inject(ApiUrlService).apiUrl);
  }

  public override controllerName(): string {
    return 'sites';
  }

  public listSites(clientId?: string): Observable<Site[]> {
    if (clientId && clientId.trim().length > 0) {
      const params = new HttpParams().set('ClientId', clientId.trim());
      return this.get({ params }).pipe(
        catchError(() => this.get().pipe(catchError(() => of([])))),
      );
    }
    return this.get().pipe(
      catchError(() => of([])),
    );
  }

  public createSite(request: CreateSiteRequest): Observable<Site> {
    const payload = {
      ClientId: request.ClientId ?? request.clientId,
      Name: request.Name ?? request.name,
      Code: (request.Code ?? request.code ?? '').toUpperCase(),
    };
    return this.http.post<Site>(this.endpointUrl, payload);
  }

  public updateSite(id: string, request: UpdateSiteRequest): Observable<Site> {
    const payload = {
      ClientId: request.ClientId ?? request.clientId,
      Name: request.Name ?? request.name,
      Code: (request.Code ?? request.code ?? '').toUpperCase(),
    };
    return this.http.put<Site>(`${this.endpointUrl}/${id}`, payload);
  }

  public setActive(id: string, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.endpointUrl}/${id}/active/${active}`, {});
  }
}
