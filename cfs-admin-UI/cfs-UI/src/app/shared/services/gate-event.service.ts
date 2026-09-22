import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class GateEventService extends BaseApiService<
  GateEventsResponse,
  GateEventDetailDto,
  GateEventCaptureRequest
> {
  private readonly gateBaseUrl = (environment as any).gateApiBaseUrl || 'https://syapi.prosperassettracking.com/api/v1';

  constructor(http: HttpClient) {
    super(http, (environment as any).gateApiBaseUrl || 'https://syapi.prosperassettracking.com/api/v1');
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
  }): Observable<VisitsPagedResponse> {
    let params = new HttpParams()
      .set('page', options?.page ?? 1)
      .set('pageSize', options?.pageSize ?? 25);

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
    }
    if (options?.to) {
      params = params.set('to', options.to);
    }
    if (options?.siteId) {
      params = params.set('siteId', options.siteId);
    }
    if (options?.clientId) {
      params = params.set('clientId', options.clientId);
    }
    if (options?.createdByUserId) {
      params = params.set('createdByUserId', options.createdByUserId);
      params = params.set('userId', options.createdByUserId);
    } else if (options?.userId) {
      params = params.set('createdByUserId', options.userId);
      params = params.set('userId', options.userId);
    }

    const url = `${this.gateBaseUrl}/gate/visits`;
    return this.http.get<VisitsPagedResponse>(url, { params }).pipe(
      catchError(() => {
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

  public getVisitById(visitId: string): Observable<VisitListItemDto | null> {
    const url = `${this.gateBaseUrl}/gate/visits/${encodeURIComponent(visitId)}`;
    return this.http.get<VisitListItemDto>(url).pipe(
      catchError(() => of(null as any)),
    );
  }

  public getGateEvents(options?: {
    visitId?: string;
    eventType?: string;
    containerNumber?: string;
    truckNumber?: string;
    page?: number;
    pageSize?: number;
  }): Observable<GateEventsResponse> {
    let params = new HttpParams()
      .set('Page', options?.page ?? 1)
      .set('PageSize', options?.pageSize ?? 20);

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

    return this.get({ params });
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
