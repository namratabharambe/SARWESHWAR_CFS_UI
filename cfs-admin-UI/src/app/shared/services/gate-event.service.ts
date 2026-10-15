import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { BaseApiService } from 'shared/services/base-api.service';
import { ApiUrlService } from 'core/services/api.url.service';
import { environment } from 'environment/environment';
import {
  GateEventsResponse,
  GateEventDetailDto,
  GateEventCaptureRequest,
  GateEventCaptureResponse,
  VisitsPagedResponse,
  VisitListItemDto,
} from 'shared/types/gate-event/gate-event.interface';

const DEFAULT_FALLBACK_SITE_ID = '01a07fd0-d69a-7998-bd0c-48b96d3b8a88';
const DEFAULT_FALLBACK_CLIENT_ID = '01a07fcf-041d-74be-8d8f-14e12d9e471b';

@Injectable({ providedIn: 'root' })
export class GateEventService extends BaseApiService<GateEventsResponse, GateEventDetailDto, GateEventCaptureRequest> {
  private readonly gateBaseUrl: string;

  public static getResolvedGateBaseUrl(): string {
    let url = String((environment as any).gateApiBaseUrl || 'https://api.smartyard.prosperinfotech.com/gate/api/v1')
      .trim()
      .replace(/\/+$/, '');
    if (url.endsWith('/api')) {
      url = `${url}/v1`;
    }
    return url;
  }

  constructor(http: HttpClient) {
    const resolvedUrl = GateEventService.getResolvedGateBaseUrl();
    super(http, resolvedUrl);
    this.gateBaseUrl = resolvedUrl;
  }

  public override controllerName(): string {
    return 'gate/events';
  }

  /**
   * Fetches paginated gate visits from GET /api/v1/gate/visits
   * e.g. https://localhost:7248/api/v1/gate/visits?page=1&pageSize=25
   */
  public getVisits(options?: {
    page?: number;
    pageSize?: number;
    visitNumber?: string;
    containerNumber?: string;
    truckNumber?: string;
    status?: string;
    from?: string;
    to?: string;
    siteId?: string;
    clientId?: string;
    createdByUserId?: string;
    userId?: string;
    eventType?: string;
  }): Observable<VisitsPagedResponse> {
    const effectiveSiteId =
      options?.siteId ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_selected_site_id') : '') ||
      DEFAULT_FALLBACK_SITE_ID;

    const effectiveClientId =
      options?.clientId ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_selected_client_id') : '') ||
      DEFAULT_FALLBACK_CLIENT_ID;

    let params = new HttpParams().set('page', options?.page ?? 1).set('pageSize', options?.pageSize ?? 25);

    if (options?.eventType) {
      const dir = options.eventType.includes('OUT') ? 'OUT' : 'IN';
      params = params
        .set('eventType', options.eventType)
        .set('EventType', options.eventType)
        .set('type', options.eventType)
        .set('Type', options.eventType)
        .set('direction', dir)
        .set('Direction', dir)
        .set('cycle', dir)
        .set('Cycle', dir);
    }

    if (options?.visitNumber) {
      params = params.set('visitNumber', options.visitNumber);
    }
    if (options?.containerNumber) {
      params = params.set('containerNumber', options.containerNumber);
    }
    if (options?.truckNumber) {
      params = params.set('truckNumber', options.truckNumber);
    }
    if (options?.status) {
      params = params.set('status', options.status);
    }
    if (options?.from) {
      params = params.set('from', options.from);
      params = params.set('fromDate', options.from);
      params = params.set('startDate', options.from);
    }
    if (options?.to) {
      params = params.set('to', options.to);
      params = params.set('toDate', options.to);
      params = params.set('endDate', options.to);
    }
    if (effectiveSiteId) {
      params = params.set('siteId', effectiveSiteId);
    }
    if (effectiveClientId) {
      params = params.set('clientId', effectiveClientId);
    }
    if (options?.createdByUserId) {
      params = params.set('createdByUserId', options.createdByUserId);
      params = params.set('userId', options.createdByUserId);
    } else if (options?.userId) {
      params = params.set('createdByUserId', options.userId);
      params = params.set('userId', options.userId);
    }

    let headers = new HttpHeaders()
      .set('X-Site-Id', effectiveSiteId)
      .set('Site-ID', effectiveSiteId);
    if (effectiveClientId) {
      headers = headers.set('X-Client-Id', effectiveClientId);
    }

    const url = `${this.gateBaseUrl}/gate/visits`;
    return this.http.get<VisitsPagedResponse>(url, { params, headers }).pipe(
      catchError((error) => {
        console.error('Failed to fetch gate visits from API:', url, error);
        return of({
          items: [],
          page: options?.page ?? 1,
          pageSize: options?.pageSize ?? 25,
          totalCount: 0,
          totalPages: 0,
        });
      }),
    );
  }

  public getVisitById(visitId: string, siteId?: string): Observable<VisitListItemDto | null> {
    const effectiveSiteId =
      siteId ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_selected_site_id') : '') ||
      DEFAULT_FALLBACK_SITE_ID;

    const headers = new HttpHeaders()
      .set('X-Site-Id', effectiveSiteId)
      .set('Site-ID', effectiveSiteId);

    const url = `${this.gateBaseUrl}/gate/visits/${encodeURIComponent(visitId)}`;
    return this.http.get<VisitListItemDto>(url, { headers }).pipe(catchError(() => of(null as any)));
  }

  public getGateEvents(options?: {
    visitId?: string;
    eventType?: string;
    containerNumber?: string;
    truckNumber?: string;
    siteId?: string;
    page?: number;
    pageSize?: number;
  }): Observable<GateEventsResponse> {
    const effectiveSiteId =
      options?.siteId ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_selected_site_id') : '') ||
      DEFAULT_FALLBACK_SITE_ID;

    const headers = new HttpHeaders()
      .set('X-Site-Id', effectiveSiteId)
      .set('Site-ID', effectiveSiteId);

    let params = new HttpParams().set('Page', options?.page ?? 1).set('PageSize', options?.pageSize ?? 20);

    if (options?.visitId) {
      params = params.set('VisitId', options.visitId);
    }
    if (options?.eventType) {
      params = params.set('EventType', options.eventType);
    }
    if (options?.containerNumber) {
      params = params.set('ContainerNumber', options.containerNumber);
    }
    if (options?.truckNumber) {
      params = params.set('TruckNumber', options.truckNumber);
    }

    return this.get({ params, headers });
  }

  public getGateEventById(id: string): Observable<GateEventDetailDto> {
    return this.getById(id);
  }

  public getGateEventsByVisitId(visitId: string): Observable<GateEventDetailDto[]> {
    return this.http.get<GateEventDetailDto[]>(`${this.endpointUrl}/visit/${encodeURIComponent(visitId)}`);
  }

  public captureGateEvent(request: GateEventCaptureRequest): Observable<GateEventCaptureResponse> {
    return this.http.post<GateEventCaptureResponse>(this.endpointUrl, request);
  }
}
