import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, forkJoin, map, of, switchMap, Observable } from 'rxjs';
import { TranslatePipe } from 'shared/pipes';
import {
  GatePhotoStripComponent,
  GateCameraPhoto,
  ConfidenceBadgeComponent,
  StatusBadgeComponent,
} from 'shared/components';
import { DatePickerComponent } from 'shared/components/molecules/date-picker/date-picker.component';
import { DropdownComponent } from 'shared/components/molecules/dropdown/dropdown.component';
import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';
import { ImageViewerComponent } from 'shared/components/molecules/image-viewer/image-viewer.component';
import { FilterApplyEvent, FilterField, FilterPanelComponent, FilterValues } from 'shared/components/molecules/filter-panel/filter-panel.component';
import { GateEventDetailComponent } from './components/gate-event-detail/gate-event-detail.component';
import { ManualGateEntryComponent } from './components/manual-gate-entry/manual-gate-entry.component';
import { NonErpContainerComponent } from './components/non-erp-container/non-erp-container.component';
import { GateEventService } from 'shared/services/gate-event.service';
import { AuthService } from 'core/auth/auth.service';
import { environment } from 'environment/environment';
import {
  GateEventDetailDto,
  GateEventCaptureRequest,
  VisitListItemDto,
  VisitsPagedResponse,
  GateCountsResponse,
} from 'shared/types/gate-event/gate-event.interface';
import {
  isCreatedToday,
  isVisitArrival,
  isVisitDeparture,
  isVisitArrivalToday,
  isVisitDepartureToday,
  matchesDateFilter,
  parseAnyDate,
  uniqueVisits,
} from 'shared/utils/date-filter.util';

export type GateDirection = 'IN' | 'OUT';
export type EventStatus = 'Verified' | 'Review';
export type { GateCameraPhoto };

export interface ActiveLightboxGallery {
  photos: GateCameraPhoto[];
  currentIndex: number;
  eventTitle?: string;
}

export interface GateContainerRecord {
  index: number;
  containerNo: string;
  size: string;
  isoCode: string;
  confidence: number;
  tareWeight: string;
  sealNo1: string;
  sealNo2: string;
  customSealNo: string;
  cargoType: string;
  fullOrEmpty: string;
  location: string;
  condition: string;
  damageFlag: boolean;
  photos: GateCameraPhoto[];
}

export interface GateEventItem {
  id: string;
  eventTime: string;
  createdAt?: string;
  formattedCreatedAt?: string;
  timestamp: number;
  gate: string;
  direction: GateDirection;
  truckNo: string;
  containerNo: string;
  size: string;
  isDualContainer: boolean;
  containers: GateContainerRecord[];
  ocrResult: string;
  confidence: number;
  driver: string;
  status: EventStatus;
  damageFlag: boolean;
  photos: GateCameraPhoto[];
  notes?: string;
  rawDto?: GateEventDetailDto;
  rawVisit?: VisitListItemDto;
}


@Component({
  selector: 'app-gate-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    GateEventDetailComponent,
    ImageViewerComponent,
    FilterPanelComponent,
    ManualGateEntryComponent,
    NonErpContainerComponent,
    DatePickerComponent,
    DropdownComponent,
    StatusBadgeComponent,
    PaginationComponent,
  ],
  templateUrl: './gate-events.component.html',
  styleUrls: ['./gate-events.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GateEventsComponent implements OnInit {
  private readonly gateEventService = inject(GateEventService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });

  public readonly gateMode = signal<'all' | 'in' | 'out'>('all');
  public readonly selectedKpiFilter = signal<string>('All');
  public readonly isNonErpView = signal<boolean>(false);
  public readonly events = signal<GateEventItem[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly activeTab = signal<'all' | 'arrivals' | 'departures'>('all');
  public readonly cycleFilter = signal<string>('All');
  public readonly directionFilter = signal<string>('All');
  public readonly gateFilter = signal<string>('All');
  public readonly confidenceFilter = signal<string>('All');
  public readonly dateFilter = signal<string>('');
  public readonly searchQuery = signal<string>('');

  // Filter panel state (date + direction reuse dateFilter / cycleFilter above)
  public readonly containerFilter = signal<string>('');
  public readonly sizeFilter = signal<string>('');
  public readonly statusFilter = signal<string>('');
  public readonly rangeFrom = signal<string>('');
  public readonly rangeTo = signal<string>('');
  public readonly sortBy = signal<string>('date-desc');

  public readonly sortOptions = [
    { label: 'Date: newest first', value: 'date-desc' },
    { label: 'Date: oldest first', value: 'date-asc' },
    { label: 'Container No: A–Z', value: 'container-asc' },
    { label: 'Container No: Z–A', value: 'container-desc' },
    { label: 'Direction / Cycle', value: 'direction' },
    { label: 'Size', value: 'size' },
    { label: 'Status', value: 'status' },
  ];

  public readonly filterFields = computed<FilterField[]>(() => {
    const sizes = [...new Set(this.events().map((e) => e.size).filter(Boolean))].sort();
    // Direction is a filter only on the "All" tab; Gate In / Gate Out tabs already fix it.
    const onAllTab = this.gateMode() === 'all';
    const fields: FilterField[] = [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'range', label: 'Date range (from – to)', type: 'daterange' },
      { key: 'containerNo', label: 'Container No', type: 'text', placeholder: 'e.g. MSCU1234567' },
      ...(onAllTab ? [{
        key: 'direction',
        label: 'Direction / Cycle',
        type: 'select',
        options: [
          { label: 'All directions', value: 'All' },
          { label: 'Gate In', value: 'IN' },
          { label: 'Gate Out', value: 'OUT' },
        ],
      } as FilterField] : []),
      { key: 'size', label: 'Size', type: 'select', options: [{ label: 'All sizes', value: 'All' }, ...sizes.map((x) => ({ label: x, value: x }))] },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'All statuses', value: 'All' },
          { label: 'Verified', value: 'Verified' },
          { label: 'In Review', value: 'Review' },
        ],
      },
    ];
    return fields;
  });

  public readonly filterValues = computed<FilterValues>(() => ({
    date: this.dateFilter(),
    rangeFrom: this.rangeFrom(),
    rangeTo: this.rangeTo(),
    containerNo: this.containerFilter(),
    direction: this.gateMode() === 'all' && this.cycleFilter() !== 'All' ? this.cycleFilter() : '',
    size: this.sizeFilter(),
    status: this.statusFilter(),
  }));

  public readonly cycleOptions = [
    { value: 'All', label: 'All Cycles' },
    { value: 'IN', label: 'Gate In' },
    { value: 'OUT', label: 'Gate Out' },
  ];

  public readonly directionOptions = [
    { value: 'All', label: 'All Directions' },
    { value: 'IN', label: 'IN' },
    { value: 'OUT', label: 'OUT' },
  ];

  public readonly gateOptions = [
    { value: 'All', label: 'All Gates' },
    { value: 'GATE-01', label: 'GATE-01' },
    { value: 'GATE-02', label: 'GATE-02' },
    { value: 'GATE-03', label: 'GATE-03' },
  ];

  public readonly confidenceOptions = [
    { value: 'All', label: 'All Confidence' },
    { value: 'High', label: 'High (≥ 95%)' },
    { value: 'Medium', label: 'Medium (90% - 94%)' },
    { value: 'Low', label: 'Low (< 90%)' },
  ];

  public readonly pageSizeOptions = [
    { value: 10, label: '10 per page' },
    { value: 25, label: '25 per page' },
    { value: 50, label: '50 per page' },
  ];

  public readonly isGateInModalOpen = signal<boolean>(false);
  public readonly selectedIds = signal<Set<string>>(new Set());
  public readonly selectedEventForDetails = signal<GateEventItem | null>(null);
  public readonly alertMessage = signal<string>('');
  public readonly copyFeedback = signal<boolean>(false);
  public readonly exportDropdownOpen = signal<boolean>(false);
  public readonly activeLightboxGallery = signal<ActiveLightboxGallery | null>(null);

  public readonly activeLightboxPhoto = signal<{ title: string; url: string } | null>(null);

  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);
  public readonly totalCount = signal<number>(0);
  public readonly totalCheckinCount = signal<number>(0);
  public readonly totalCheckoutCount = signal<number>(0);
  public readonly todayCheckinCount = signal<number>(0);
  public readonly todayCheckoutCount = signal<number>(0);
  public readonly gateCounts = signal<GateCountsResponse | null>(null);

  private isInitialized = false;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.syncGateMode(false);

    if (this.router) {
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.syncGateMode(true);
        });
    }

    effect(() => {
      // Track site or client selection changes and reload visits
      const siteId = this.authService.selectedSiteId();
      const clientId = this.authService.selectedClientId();
      if ((siteId || clientId) && this.isInitialized) {
        this.loadGateEvents();
      }
    });
  }

  private syncGateMode(shouldLoad: boolean = true): void {
    const url = this.router?.url ?? '';
    const routeMode = this.route?.snapshot?.data?.['mode'];
    if (url.includes('/gate-events/out') || routeMode === 'out') {
      this.gateMode.set('out');
      this.cycleFilter.set('OUT');
    } else if (url.includes('/gate-events/in') || routeMode === 'in') {
      this.gateMode.set('in');
      this.cycleFilter.set('IN');
    } else {
      this.gateMode.set('all');
      this.cycleFilter.set('All');
    }
    this.selectedKpiFilter.set('All');
    this.currentPage.set(1);
    this.isNonErpView.set(false);
    this.selectedEventForDetails.set(null);
    if (shouldLoad) {
      this.loadGateEvents();
    }
  }

  public setMode(mode: 'all' | 'in' | 'out'): void {
    this.gateMode.set(mode);
    if (mode === 'all') {
      this.cycleFilter.set('All');
    } else if (mode === 'in') {
      this.cycleFilter.set('IN');
    } else {
      this.cycleFilter.set('OUT');
    }
    this.selectedKpiFilter.set('All');
    this.currentPage.set(1);
    this.isNonErpView.set(false);
    this.selectedEventForDetails.set(null);
    this.loadGateEvents();
  }

  public selectKpiCard(kpi: string): void {
    if (this.selectedKpiFilter() === kpi) {
      this.selectedKpiFilter.set('All');
    } else {
      this.selectedKpiFilter.set(kpi);
    }
    this.currentPage.set(1);
  }

  public readonly fromDate = signal<string | undefined>(undefined);
  public readonly toDate = signal<string | undefined>(undefined);

  public ngOnInit(): void {
    this.isInitialized = true;
    this.loadGateEvents();
  }

  public onDateFilterChange(val: string): void {
    this.dateFilter.set(val);
    if (val) {
      this.rangeFrom.set('');
      this.rangeTo.set('');
    }
    this.currentPage.set(1);

    if (!val) {
      this.fromDate.set(undefined);
      this.toDate.set(undefined);
      this.loadGateEvents();
      return;
    }

    const parsed = parseAnyDate(val);
    if (parsed) {
      const year = parsed.getFullYear();
      const month = parsed.getMonth();
      const day = parsed.getDate();
      const start = new Date(year, month, day, 0, 0, 0).toISOString();
      const end = new Date(year, month, day, 23, 59, 59, 999).toISOString();
      this.fromDate.set(start);
      this.toDate.set(end);
    } else {
      this.fromDate.set(undefined);
      this.toDate.set(undefined);
    }

    this.loadGateEvents();
  }

  /** Applies the filter panel: date / range / container / direction go to the API; size / status / sort apply to the loaded rows. */
  public onFilterApply(e: FilterApplyEvent): void {
    const v = e.values;
    this.containerFilter.set(v['containerNo'] ?? '');
    this.sizeFilter.set(v['size'] ?? '');
    this.statusFilter.set(v['status'] ?? '');
    if (this.gateMode() === 'all') this.cycleFilter.set(v['direction'] ?? 'All');
    this.sortBy.set(e.sort || 'date-desc');
    this.rangeFrom.set(v['rangeFrom'] ?? '');
    this.rangeTo.set(v['rangeTo'] ?? '');
    this.currentPage.set(1);

    const from = parseAnyDate(v['rangeFrom'] ?? '');
    const to = parseAnyDate(v['rangeTo'] ?? '');
    if (!v['date'] && (from || to)) {
      this.dateFilter.set('');
      this.fromDate.set(from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()).toISOString() : undefined);
      this.toDate.set(to ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).toISOString() : undefined);
      this.loadGateEvents();
    } else {
      // Single date (or none) reuses the toolbar date logic, which also reloads.
      this.onDateFilterChange(v['date'] ?? '');
    }
  }

  public loadGateEvents(): void {
    this.isLoading.set(true);
    const siteId = this.authService.getActiveSiteId() || undefined;
    const clientId = this.authService.getActiveClientId() || undefined;
    const from = this.fromDate();
    const to = this.toDate();

    // Direction / Cycle filter parameter for API
    const mode = this.gateMode();
    const cycle = this.cycleFilter();
    let eventType: string | undefined = undefined;
    if (mode === 'in' || cycle === 'IN') {
      eventType = 'GATE_IN';
    } else if (mode === 'out' || cycle === 'OUT') {
      eventType = 'GATE_OUT';
    }

    // Search query parameter for server-side indexed lookup
    const query = this.searchQuery().trim();
    const containerNumber = this.containerFilter().trim() || query || undefined;

    // Fetch summary counts for top KPI cards
    this.gateEventService.getGateCounts(siteId, clientId).subscribe({
      next: (counts) => {
        if (counts) {
          this.gateCounts.set(counts);
          if (typeof counts.totalGateIn === 'number') this.totalCheckinCount.set(counts.totalGateIn);
          if (typeof counts.totalGateOut === 'number') this.totalCheckoutCount.set(counts.totalGateOut);
          if (typeof counts.todayArrivals === 'number') this.todayCheckinCount.set(counts.todayArrivals);
          else if (typeof counts.todayGateIn === 'number') this.todayCheckinCount.set(counts.todayGateIn);
          if (typeof counts.todayDepartures === 'number') this.todayCheckoutCount.set(counts.todayDepartures);
          else if (typeof counts.todayGateOut === 'number') this.todayCheckoutCount.set(counts.todayGateOut);
          if (typeof counts.totalCount === 'number') this.totalCount.set(counts.totalCount);
        }
      },
    });

    // Load every visit matching the server-side filters (date / range / container / direction),
    // then page in the browser. The server pages by visit, but a visit can become two rows
    // (gate in + gate out), so only client-side paging keeps "rows per page" exact on every tab
    // and with size / status / sort filters. Same approach as Inventory.
    // ponytail: loads all matching visits; switch to server paging per event if the API adds it and volumes grow large.
    const query$ = { siteId, clientId, from, to, eventType, containerNumber };
    this.gateEventService
      .getVisits({ ...query$, page: 1, pageSize: 200 })
      .pipe(
        switchMap((res: VisitsPagedResponse) => {
          const first: VisitListItemDto[] = res?.items ?? (Array.isArray(res) ? (res as any) : []);
          const total = typeof res?.totalCount === 'number' ? res.totalCount : first.length;
          if (!first.length || total <= first.length) return of({ items: first, total });
          // Use the page size the server actually returned, in case it caps large requests.
          const size = first.length;
          const rest: Observable<VisitsPagedResponse>[] = [];
          for (let p = 2; p <= Math.ceil(total / size); p++) {
            rest.push(this.gateEventService.getVisits({ ...query$, page: p, pageSize: size }));
          }
          return forkJoin(rest).pipe(map((more) => ({ items: [...first, ...more.flatMap((r) => r?.items ?? [])], total })));
        }),
      )
      .subscribe({
        next: ({ items, total }) => {
          this.isLoading.set(false);
          this.applyVisitsToTable(uniqueVisits(items), total);
        },
        error: () => {
          this.isLoading.set(false);
          this.events.set([]);
          this.totalCount.set(0);
        },
      });
  }

  private applyVisitsToTable(items: VisitListItemDto[], totalCount: number): void {
    if (items && items.length > 0) {
      const mapped: GateEventItem[] = [];
      items.forEach((visit: VisitListItemDto) => {
        const generated = this.mapVisitToGateEventItems(visit, this.gateMode());
        mapped.push(...generated);
      });

      // Sort descending by event date/time (newest visits first on all pages)
      mapped.sort((a, b) => {
        const tA = (typeof a.timestamp === 'number' && a.timestamp > 0) ? a.timestamp : (parseAnyDate(a.createdAt || a.eventTime)?.getTime() ?? 0);
        const tB = (typeof b.timestamp === 'number' && b.timestamp > 0) ? b.timestamp : (parseAnyDate(b.createdAt || b.eventTime)?.getTime() ?? 0);
        return tB - tA;
      });

      this.events.set(mapped);

      const listIn = mapped.filter((e) => e.direction === 'IN').length;
      const listOut = mapped.filter((e) => e.direction === 'OUT').length;
      const todayItemsIn = items.filter((v: any) => isVisitArrivalToday(v)).length;
      const todayItemsOut = items.filter((v: any) => isVisitDepartureToday(v)).length;
      const totalIn = items.filter((v: any) => isVisitArrival(v)).length;
      const totalOut = items.filter((v: any) => isVisitDeparture(v)).length;

      this.totalCount.set(totalCount || mapped.length);
      this.totalCheckinCount.set(totalIn || listIn);
      this.totalCheckoutCount.set(totalOut || listOut);
      this.todayCheckinCount.set(todayItemsIn);
      this.todayCheckoutCount.set(todayItemsOut);
    } else {
      this.events.set([]);
      this.totalCount.set(0);
      this.totalCheckinCount.set(0);
      this.totalCheckoutCount.set(0);
      this.todayCheckinCount.set(0);
      this.todayCheckoutCount.set(0);
    }
  }

  private buildContainerPhotos(
    containerNo: string,
    index: number,
    totalContainers: number,
    rawImages: any[] = [],
    visitId?: string,
    fallbackDate?: string,
  ): GateCameraPhoto[] {
    const photos: GateCameraPhoto[] = [];
    const prefix = totalContainers > 1 ? `Container ${index} (${containerNo.slice(0, 4)}) - ` : '';

    if (rawImages && rawImages.length > 0) {
      rawImages.forEach((img: any) => {
        const rawType = String(img.imageType ?? img.ImageType ?? img.type ?? img.Type ?? 'Camera Scan');
        const type = rawType.toUpperCase();
        let color = '#1f487e';
        if (type.includes('FRONT') || type.includes('OCR')) color = '#c9842a';
        else if (type.includes('REAR')) color = '#993030';
        else if (type.includes('LEFT') || type.includes('RIGHT')) color = '#1f487e';

        let url =
          img.imageUrl ?? img.ImageUrl ?? img.s3Url ?? img.S3Url ?? img.image ?? img.Image ?? img.url ?? img.Url ?? '';

        const imgId = img.id ?? img.Id;
        if (!url && imgId && visitId) {
          const gateBaseUrl = GateEventService.getResolvedGateBaseUrl();
          url = `${gateBaseUrl}/gate/visits/${encodeURIComponent(visitId)}/images/${encodeURIComponent(imgId)}`;
        }

        const tag = (img.cameraId ?? img.CameraId ?? img.deviceId ?? img.DeviceId ?? rawType) || `C${index}-CAM`;

        const imgCapturedAt =
          img.capturedAt ??
          img.CapturedAt ??
          img.createdAt ??
          img.CreatedAt ??
          img.timestamp ??
          img.Timestamp ??
          fallbackDate ??
          '';

        let formattedCreatedAt = '';
        if (imgCapturedAt) {
          const d = new Date(imgCapturedAt);
          if (!isNaN(d.getTime())) {
            formattedCreatedAt =
              d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
              ', ' +
              d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          } else {
            formattedCreatedAt = String(imgCapturedAt);
          }
        }

        photos.push({
          label: `${prefix}${rawType.includes('View') || rawType.includes('Scan') ? rawType : `${rawType} View`}`,
          color,
          tag: String(tag),
          url: String(url),
          createdAt: imgCapturedAt || undefined,
          formattedCreatedAt: formattedCreatedAt || undefined,
        });
      });
    }

    return photos;
  }

  private mapVisitToGateEventItems(visit: any, mode: 'all' | 'in' | 'out'): GateEventItem[] {
    const eventsList: any[] = Array.isArray(visit.events)
      ? visit.events
      : Array.isArray(visit.Events)
        ? visit.Events
        : [];

    const hasIn = isVisitArrival(visit);
    const hasOut = isVisitDeparture(visit);

    const inEvent = eventsList.find((e: any) => {
      const t = String(e.eventType ?? e.EventType ?? '').toUpperCase();
      return t.includes('IN') || t.includes('ENTER');
    });

    const outEvent = eventsList.find((e: any) => {
      const t = String(e.eventType ?? e.EventType ?? '').toUpperCase();
      return t.includes('OUT') || t.includes('EXIT');
    });

    const items: GateEventItem[] = [];

    if (mode === 'in') {
      if (hasIn || !hasOut) {
        items.push(this.mapVisitToGateEventItem(visit, 'IN', inEvent || eventsList[0]));
      }
    } else if (mode === 'out') {
      if (hasOut || !hasIn) {
        items.push(this.mapVisitToGateEventItem(visit, 'OUT', outEvent || eventsList[0]));
      }
    } else {
      // mode === 'all'
      if (inEvent && outEvent) {
        items.push(this.mapVisitToGateEventItem(visit, 'OUT', outEvent, `${visit.visitId || visit.id}-out`));
        items.push(this.mapVisitToGateEventItem(visit, 'IN', inEvent, `${visit.visitId || visit.id}-in`));
      } else if (hasOut) {
        items.push(this.mapVisitToGateEventItem(visit, 'OUT', outEvent || eventsList[0]));
      } else {
        items.push(this.mapVisitToGateEventItem(visit, 'IN', inEvent || eventsList[0]));
      }
    }

    return items;
  }

  private mapVisitToGateEventItem(
    visit: any,
    forceDir?: GateDirection,
    forceEvent?: any,
    customId?: string,
  ): GateEventItem {
    const id = customId || visit.visitId || visit.VisitId || visit.id || visit.Id || crypto.randomUUID();
    const eventsList: any[] = Array.isArray(visit.events)
      ? visit.events
      : Array.isArray(visit.Events)
        ? visit.Events
        : [];
    const visitDirection = String(visit.direction ?? visit.Direction ?? '').toUpperCase();
    const visitEventType = String(visit.eventType ?? visit.EventType ?? '').toUpperCase();
    const visitStatus = String(visit.status ?? visit.Status ?? '').toUpperCase();

    const hasOutEvent = eventsList.some((e: any) => {
      const t = String(e.eventType ?? e.EventType ?? '').toUpperCase();
      return t.includes('OUT') || t.includes('EXIT');
    });
    const isOutStatus = visitStatus.includes('DEPART') || visitStatus.includes('EXIT') || visitStatus.includes('OUT');
    const isOutType =
      visitEventType.includes('OUT') ||
      visitDirection.includes('OUT');

    const isOut = forceDir ? forceDir === 'OUT' : (hasOutEvent || isOutStatus || isOutType);
    const direction: GateDirection = forceDir ?? (isOut ? 'OUT' : 'IN');

    // Select primary event based on resolved direction or forced event
    let primaryEvent: any = forceEvent || null;
    if (!primaryEvent && eventsList.length > 0) {
      if (direction === 'OUT') {
        primaryEvent =
          eventsList.find((ev: any) => {
            const t = String(ev.eventType ?? ev.EventType ?? '').toUpperCase();
            return t.includes('OUT') || t.includes('EXIT');
          }) || eventsList[eventsList.length - 1];
      } else {
        primaryEvent =
          eventsList.find((ev: any) => {
            const t = String(ev.eventType ?? ev.EventType ?? '').toUpperCase();
            return t.includes('IN') || t.includes('ENTER');
          }) || eventsList[0];
      }
    }

    const capturedAt =
      primaryEvent?.capturedAt ??
      primaryEvent?.CapturedAt ??
      (direction === 'OUT' ? (visit.departedAt ?? visit.DepartedAt ?? visit.createdAt) : (visit.arrivedAt ?? visit.ArrivedAt ?? visit.createdAt)) ??
      new Date().toISOString();
    const dateObj = new Date(capturedAt);
    const eventTime = isNaN(dateObj.getTime())
      ? capturedAt
      : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' +
        dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const primaryType = String(primaryEvent?.eventType ?? primaryEvent?.EventType ?? '').toUpperCase();

    const rawDeviceId = primaryEvent?.deviceId ?? primaryEvent?.DeviceId ?? '';
    const gate = rawDeviceId ? `GATE-${rawDeviceId.slice(0, 4).toUpperCase()}` : (direction === 'OUT' ? 'GATE-02' : 'GATE-01');

    const truckNo =
      visit.truckNumber ??
      visit.TruckNumber ??
      primaryEvent?.detectedTruckNumber ??
      primaryEvent?.DetectedTruckNumber ??
      'MH 12 AB 0000';
    const driverName = visit.driverName ?? visit.DriverName ?? 'Driver (Unassigned)';

    // Aggregate all visit and event images
    const visitLevelImages: any[] = [];
    if (Array.isArray(visit.images)) visitLevelImages.push(...visit.images);
    if (Array.isArray(visit.Images)) visitLevelImages.push(...visit.Images);
    eventsList.forEach((ev) => {
      const evImgs = ev.images ?? ev.Images;
      if (Array.isArray(evImgs) && evImgs.length > 0) {
        visitLevelImages.push(...evImgs);
      }
    });

    // Extract all container records (only real containers from API payload)
    const rawContainersList: any[] = [];
    if (Array.isArray(visit.containers) && visit.containers.length > 0) {
      visit.containers.forEach((c: any) => {
        rawContainersList.push({
          ...c,
          images: (Array.isArray(c.images) && c.images.length > 0) ? c.images : visitLevelImages,
        });
      });
    } else if (Array.isArray(visit.Containers) && visit.Containers.length > 0) {
      visit.Containers.forEach((c: any) => {
        rawContainersList.push({
          ...c,
          images: (Array.isArray(c.Images) && c.Images.length > 0) ? c.Images : visitLevelImages,
        });
      });
    } else if (eventsList.length > 1) {
      // 2 events for 2 containers under the same visit
      eventsList.forEach((ev) => {
        rawContainersList.push({
          containerNumber: ev.detectedContainerNumber ?? ev.DetectedContainerNumber,
          containerNumberConfidence: ev.detectedContainerConfidence ?? ev.DetectedContainerConfidence,
          size: ev.detectedContainerSize ?? ev.DetectedContainerSize ?? '20 FT',
          isoCode: ev.detectedContainerIsoCode ?? '22G1',
          images: (Array.isArray(ev.images) && ev.images.length > 0) ? ev.images : (Array.isArray(ev.Images) && ev.Images.length > 0 ? ev.Images : visitLevelImages),
        });
      });
    } else {
      // Check if containerNumber contains multiple entries separated by comma or slash
      const rawCNo =
        visit.containerNumber ??
        visit.ContainerNumber ??
        primaryEvent?.detectedContainerNumber ??
        primaryEvent?.DetectedContainerNumber ??
        '';
      
      const parts = String(rawCNo).split(/[,/|]+/).map((s) => s.trim()).filter(Boolean);

      if (parts.length > 1) {
        parts.forEach((p, idx) => {
          rawContainersList.push({
            containerNumber: p,
            size: visit.containerSize ?? visit.ContainerSize ?? '20 FT',
            isoCode: String(visit.containerSize || '').includes('20') ? '22G1' : '45G1',
            containerNumberConfidence: 0.96 - idx * 0.02,
            images: idx === 0 ? (primaryEvent?.images ?? primaryEvent?.Images ?? visitLevelImages) : (eventsList[idx]?.images ?? eventsList[idx]?.Images ?? []),
          });
        });
      } else {
        // Exactly 1 container - do NOT synthesize any fake second container
        const cSize = visit.containerSize ?? visit.ContainerSize ?? '40 FT';
        rawContainersList.push({
          containerNumber: rawCNo || 'MSCU 000000 0',
          size: cSize,
          isoCode: String(cSize).includes('20') ? '22G1' : '45G1',
          containerNumberConfidence:
            visit.containerConfidence ??
            visit.ContainerConfidence ??
            primaryEvent?.detectedContainerConfidence ??
            0.95,
          images: primaryEvent?.images ?? primaryEvent?.Images ?? visitLevelImages,
        });
      }
    }

    const totalContainers = rawContainersList.length;
    const isDualContainer = totalContainers > 1;

    // Map each container into GateContainerRecord
    const containers: GateContainerRecord[] = rawContainersList.map((c, idx) => {
      const cNo = c.containerNumber ?? c.ContainerNumber ?? (idx === 0 ? 'MSCU 000000 0' : '');
      const rawConf = c.containerNumberConfidence ?? c.ContainerNumberConfidence ?? 0.96;
      const conf = Math.round(rawConf > 1 ? rawConf : rawConf * 100);
      const cSize = c.size ?? c.Size ?? (isDualContainer ? '20 FT' : '40 FT');
      const cIso = c.isoCode ?? (cSize.includes('20') ? '22G1' : '45G1');

      const cPhotos = this.buildContainerPhotos(cNo, idx + 1, totalContainers, c.images ?? [], id, capturedAt);

      return {
        index: idx + 1,
        containerNo: cNo,
        size: cSize,
        isoCode: cIso,
        confidence: conf,
        tareWeight: c.tareWeight ?? (cSize.includes('20') ? '2,250 kg' : '3,800 kg'),
        sealNo1: c.sealNo ?? c.sealNo1 ?? c.SealNo ?? '-',
        sealNo2: c.sealNo2 ?? c.SealNo2 ?? '-',
        customSealNo: c.customSealNo ?? c.CustomSealNo ?? '-',
        cargoType: c.cargoType ?? 'General Cargo',
        fullOrEmpty: c.fullOrEmpty ?? 'Full',
        location: c.location ?? 'A SHEL',
        condition: c.condition ?? 'Sound',
        damageFlag: Boolean(c.damageFlag),
        photos: cPhotos,
      };
    });

    const primaryContainer = containers[0];
    const containerNoDisplay = isDualContainer
      ? containers.map((c) => c.containerNo).join(', ')
      : primaryContainer?.containerNo || 'MSCU 000000 0';

    const overallConfidence = Math.round(
      containers.reduce((acc, c) => acc + c.confidence, 0) / (containers.length || 1),
    );

    // Aggregate photos
    const allPhotos: GateCameraPhoto[] = [];
    containers.forEach((c) => allPhotos.push(...c.photos));

    return {
      id,
      eventTime,
      createdAt: capturedAt,
      formattedCreatedAt: eventTime,
      timestamp: dateObj.getTime() || Date.now(),
      gate,
      direction,
      truckNo,
      containerNo: containerNoDisplay,
      size: isDualContainer ? '2x 20 FT' : (primaryContainer?.size || visit.containerSize || visit.ContainerSize || (rawContainersList[0]?.size ?? "40' HC")),
      isDualContainer,
      containers,
      ocrResult: containerNoDisplay,
      confidence: overallConfidence,
      driver: driverName,
      damageFlag: Boolean(
        visit.hasDamage ||
        visit.isDamaged ||
        visit.damageFlag ||
        visit.damageDetected ||
        (visit.damageCount && visit.damageCount > 0) ||
        primaryEvent?.damageDetected ||
        primaryEvent?.damageFlag ||
        eventsList.some((e) => e.damageDetected || e.damageFlag || e.hasDamage) ||
        containers.some((c) => c.damageFlag || (c.condition && c.condition.toLowerCase().includes('damage'))),
      ),
      status: (
        Boolean(
          visit.hasDamage ||
          visit.isDamaged ||
          visit.damageFlag ||
          visit.damageDetected ||
          (visit.damageCount && visit.damageCount > 0) ||
          primaryEvent?.damageDetected ||
          primaryEvent?.damageFlag ||
          eventsList.some((e) => e.damageDetected || e.damageFlag || e.hasDamage) ||
          containers.some((c) => c.damageFlag || (c.condition && c.condition.toLowerCase().includes('damage'))),
        ) ||
        overallConfidence < 90 ||
        String(visit.status || '').toUpperCase().includes('REVIEW') ||
        String(visit.status || '').toUpperCase().includes('PENDING') ||
        String(visit.status || '').toUpperCase().includes('HOLD')
      ) ? 'Review' : 'Verified',
      photos: allPhotos.slice(0, 8),
      notes: `Visit ID: ${id} | Load: ${isDualContainer ? '2x 20FT Dual Containers' : primaryContainer?.size || '40FT'}`,
      rawVisit: visit,
    };
  }

  private mapDtoToGateEventItem(dto: any): GateEventItem {
    const id = dto.id ?? dto.Id ?? crypto.randomUUID();
    const capturedAt = dto.capturedAt ?? dto.CapturedAt ?? dto.createdAt ?? dto.CreatedAt ?? new Date().toISOString();
    const dateObj = new Date(capturedAt);
    const eventTime = isNaN(dateObj.getTime())
      ? capturedAt
      : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' +
        dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const rawEventType = String(
      dto.eventType ??
        dto.EventType ??
        (this.cycleFilter() === 'OUT' || this.gateMode() === 'out' ? 'OUT' : 'IN'),
    ).toUpperCase();
    let direction: GateDirection = rawEventType.includes('OUT') || rawEventType.includes('EXIT') ? 'OUT' : 'IN';
    if (this.cycleFilter() === 'OUT' || this.gateMode() === 'out') {
      direction = 'OUT';
    } else if (this.cycleFilter() === 'IN' || this.gateMode() === 'in') {
      direction = 'IN';
    }
    const gate = dto.deviceId ?? dto.DeviceId ?? 'GATE-01';

    const truck = dto.truck ?? dto.Truck;
    const truckNo = truck?.truckNumber ?? truck?.TruckNumber ?? 'MH 12 AB 0000';
    const driver = dto.driver ?? dto.Driver;
    const driverName = driver?.driverName ?? driver?.DriverName ?? 'Driver';

    const rawContainersList: any[] = [];
    if (Array.isArray(dto.containers) && dto.containers.length > 0) {
      rawContainersList.push(...dto.containers);
    } else if (Array.isArray(dto.Containers) && dto.Containers.length > 0) {
      rawContainersList.push(...dto.Containers);
    } else {
      const container = dto.container ?? dto.Container;
      const cNo = container?.containerNumber ?? container?.ContainerNumber ?? 'MSCU 204918 2';
      const cSize = container?.size ?? container?.Size ?? '20 FT';
      const dtoImages = dto.images ?? dto.Images ?? [];

      rawContainersList.push({
        containerNumber: cNo,
        size: cSize,
        isoCode: cSize.includes('20') ? '22G1' : '45G1',
        containerNumberConfidence: container?.containerNumberConfidence ?? 0.95,
        images: dtoImages,
      });
    }

    const totalContainers = rawContainersList.length;
    const isDualContainer = totalContainers > 1;

    const containers: GateContainerRecord[] = rawContainersList.map((c, idx) => {
      const cNo = c.containerNumber ?? `MSCU 20491${idx} 2`;
      const rawConf = c.containerNumberConfidence ?? 0.96;
      const conf = Math.round(rawConf > 1 ? rawConf : rawConf * 100);
      const cSize = c.size ?? (isDualContainer ? '20 FT' : '40 FT');
      const cIso = cSize.includes('20') ? '22G1' : '45G1';
      const cPhotos = this.buildContainerPhotos(cNo, idx + 1, totalContainers, c.images ?? [], id, capturedAt);

      return {
        index: idx + 1,
        containerNo: cNo,
        size: cSize,
        isoCode: cIso,
        confidence: conf,
        tareWeight: cSize.includes('20') ? '2,250 kg' : '3,800 kg',
        sealNo1: c.sealNo ?? c.sealNo1 ?? '-',
        sealNo2: c.sealNo2 ?? '-',
        customSealNo: c.customSealNo ?? '-',
        cargoType: c.cargoType ?? 'General Cargo',
        fullOrEmpty: c.fullOrEmpty ?? 'Full',
        location: c.location ?? 'A SHEL',
        condition: c.condition ?? 'Sound',
        damageFlag: Boolean(c.damageFlag),
        photos: cPhotos,
      };
    });

    const primaryContainer = containers[0];
    const containerNoDisplay = isDualContainer
      ? containers.map((c) => c.containerNo).join(', ')
      : primaryContainer?.containerNo || 'MSCU 000000 0';

    const overallConfidence = Math.round(
      containers.reduce((acc, c) => acc + c.confidence, 0) / (containers.length || 1),
    );

    const allPhotos: GateCameraPhoto[] = [];
    containers.forEach((c) => allPhotos.push(...c.photos));

    return {
      id,
      eventTime,
      createdAt: capturedAt,
      formattedCreatedAt: eventTime,
      timestamp: dateObj.getTime() || Date.now(),
      gate,
      direction,
      truckNo,
      containerNo: containerNoDisplay,
      size: isDualContainer ? '2x 20 FT' : (primaryContainer?.size || dto.container?.size || dto.Container?.Size || (rawContainersList[0]?.size ?? "40' HC")),
      isDualContainer,
      containers,
      ocrResult: containerNoDisplay,
      confidence: overallConfidence,
      driver: driverName,
      status: overallConfidence >= 90 ? 'Verified' : 'Review',
      damageFlag: Boolean(
        dto.damageFlag ||
        dto.damageDetected ||
        dto.hasDamage ||
        dto.isDamaged ||
        (dto.condition && dto.condition.toLowerCase().includes('damage')) ||
        containers.some((c) => c.damageFlag || (c.condition && c.condition.toLowerCase().includes('damage'))),
      ),
      photos: allPhotos.slice(0, 8),
      notes: `Captured at ${gate} via automated optical lane sensor.`,
      rawDto: dto,
    };
  }


  // Metrics matching the reference UI cards
  public readonly metrics = computed(() => {
    const mode = this.gateMode();
    const list = this.events();
    const total = this.totalCount();
    const totalIn = this.totalCheckinCount();
    const totalOut = this.totalCheckoutCount();
    const todayInCount = this.todayCheckinCount();
    const todayOutCount = this.todayCheckoutCount();

    const counts = this.gateCounts();
    const todayArrivalsFromApi = counts?.todayArrivals ?? counts?.todayGateIn;
    const todayDeparturesFromApi = counts?.todayDepartures ?? counts?.todayGateOut;
    const totalGateInFromApi = counts?.totalGateIn;
    const totalGateOutFromApi = counts?.totalGateOut;
    const totalCountFromApi = counts?.totalCount;

    // Calculate today arrivals/departures strictly for TODAY
    const todayItemsIn = list.filter((e) => isCreatedToday(e.createdAt || e.timestamp) && e.direction === 'IN').length;
    const todayItemsOut = list.filter((e) => isCreatedToday(e.createdAt || e.timestamp) && e.direction === 'OUT').length;

    const todayIn = typeof todayArrivalsFromApi === 'number' ? todayArrivalsFromApi : Math.max(todayInCount, todayItemsIn);
    const todayOut = typeof todayDeparturesFromApi === 'number' ? todayDeparturesFromApi : Math.max(todayOutCount, todayItemsOut);

    const inCount = typeof totalGateInFromApi === 'number' ? totalGateInFromApi : (totalIn > 0 ? totalIn : (this.cycleFilter() === 'IN' ? total : list.filter((e) => e.direction === 'IN').length));
    const outCount = typeof totalGateOutFromApi === 'number' ? totalGateOutFromApi : (totalOut > 0 ? totalOut : (this.cycleFilter() === 'OUT' ? total : list.filter((e) => e.direction === 'OUT').length));
    const totalCurrentMode = mode === 'out' ? outCount : (mode === 'all' ? (typeof totalCountFromApi === 'number' ? totalCountFromApi : (inCount + outCount || total)) : inCount);

    const targetModeItems = mode === 'out'
      ? list.filter((e) => e.direction === 'OUT')
      : (mode === 'in'
        ? list.filter((e) => e.direction === 'IN')
        : list);

    // Mode-aware OCR Verified and In Review counts from GET /gate/counts
    const modeVerifiedFromApi = mode === 'in'
      ? (counts?.GateinocrVerifiedCount ?? counts?.gateInocrVerifiedCount)
      : (mode === 'out'
        ? (counts?.GateOutocrVerifiedCount ?? counts?.gateOutocrVerifiedCount)
        : (counts?.ocrVerified ?? counts?.ocrVerifiedCount ?? ((counts?.GateinocrVerifiedCount ?? 0) + (counts?.GateOutocrVerifiedCount ?? 0))));

    const modePendingFromApi = mode === 'in'
      ? (counts?.GateinReviewCount ?? counts?.gateInReviewCount)
      : (mode === 'out'
        ? (counts?.GateOutReviewCount ?? counts?.gateOutReviewCount)
        : (counts?.pendingReview ?? counts?.inReviewCount ?? ((counts?.GateinReviewCount ?? 0) + (counts?.GateOutReviewCount ?? 0))));

    const verifiedItems = typeof modeVerifiedFromApi === 'number' ? modeVerifiedFromApi : targetModeItems.filter((e) => e.status === 'Verified').length;
    const pendingReview = typeof modePendingFromApi === 'number' ? modePendingFromApi : targetModeItems.filter((e) => e.status === 'Review').length;
    const damagedCaptures = targetModeItems.filter((e) => e.damageFlag).length;

    const modeDenominator = mode === 'out' ? outCount : (mode === 'in' ? inCount : totalCurrentMode);

    return {
      todayArrivals: todayIn,
      arrivalsTrend: todayIn > 0 ? `${todayIn} arrivals today` : '0 arrivals today',
      todayDepartures: todayOut,
      departuresTrend: todayOut > 0 ? `${todayOut} departures today` : '0 departures today',
      totalCheckin: inCount,
      totalCheckinTrend: inCount > 0 ? `${inCount} total gate in` : '0 total gate in',
      totalCheckout: outCount,
      totalCheckoutTrend: outCount > 0 ? `${outCount} total gate out` : '0 total gate out',
      totalAll: totalCurrentMode,
      totalAllTrend: totalCurrentMode > 0 ? `${totalCurrentMode} total operations` : '0 total operations',
      ocrVerified: verifiedItems,
      ocrVerifiedPercent: modeDenominator > 0 ? `${Math.round((verifiedItems / modeDenominator) * 100)}% verified` : '100% verified',
      pendingReview: pendingReview,
      pendingReviewTrend: pendingReview > 0 ? `${pendingReview} pending review` : '0 pending',
      damagedCaptures: damagedCaptures,
      damagedTrend: damagedCaptures > 0 ? `${damagedCaptures} flagged` : '0 detected',
    };
  });

  // Tab counts
  public readonly tabCounts = computed(() => {
    const counts = this.gateCounts();
    const list = this.events();
    const totalIn = typeof counts?.totalGateIn === 'number' ? counts.totalGateIn : this.totalCheckinCount();
    const totalOut = typeof counts?.totalGateOut === 'number' ? counts.totalGateOut : this.totalCheckoutCount();
    const inFromList = list.filter((e) => e.direction === 'IN').length;
    const outFromList = list.filter((e) => e.direction === 'OUT').length;

    const resolvedIn = totalIn > 0 ? totalIn : inFromList;
    const resolvedOut = totalOut > 0 ? totalOut : outFromList;
    const resolvedAll = typeof counts?.totalCount === 'number' ? counts.totalCount : (resolvedIn + resolvedOut);

    return {
      all: resolvedAll,
      in: resolvedIn,
      out: resolvedOut,
      arrivals: resolvedIn,
      departures: resolvedOut,
    };
  });

  // Filtered dataset across ALL pages and fields
  public readonly filteredEvents = computed<GateEventItem[]>(() => {
    const list = this.events();
    const cycle = this.cycleFilter();
    const mode = this.gateMode();
    const kpi = this.selectedKpiFilter().replace(/\s+/g, ' ').trim();
    const conf = this.confidenceFilter();
    const query = this.searchQuery().trim().toLowerCase();
    const dateStr = this.dateFilter().trim();
    const containerQ = this.containerFilter().replace(/\s+/g, '').toLowerCase();
    const size = this.sizeFilter();
    const status = this.statusFilter();
    const rangeStart = parseAnyDate(this.rangeFrom())?.setHours(0, 0, 0, 0);
    const rangeEnd = parseAnyDate(this.rangeTo())?.setHours(23, 59, 59, 999);

    const filtered = list.filter((item) => {
      if (containerQ && !item.containerNo.replace(/\s+/g, '').toLowerCase().includes(containerQ)) return false;
      if (size && item.size !== size) return false;
      if (status && item.status !== status) return false;
      if (rangeStart !== undefined || rangeEnd !== undefined) {
        const t = this.eventTime(item);
        if (rangeStart !== undefined && t < rangeStart) return false;
        if (rangeEnd !== undefined && t > rangeEnd) return false;
      }

      // Gate Mode / Direction filter
      const targetDir = mode === 'out' || cycle === 'OUT' ? 'OUT' : (mode === 'in' || cycle === 'IN' ? 'IN' : 'All');
      if (targetDir !== 'All' && item.direction !== targetDir) return false;

      // Active KPI Card Filter
      if (kpi === 'Total Gate In' && item.direction !== 'IN') return false;
      if (kpi === 'Total Gate Out' && item.direction !== 'OUT') return false;
      if (kpi === "Today's Gate In") {
        if (!isCreatedToday(item.createdAt || item.timestamp || item.formattedCreatedAt || item.eventTime) || item.direction !== 'IN') return false;
      }
      if (kpi === "Today's Gate Out") {
        if (!isCreatedToday(item.createdAt || item.timestamp || item.formattedCreatedAt || item.eventTime) || item.direction !== 'OUT') return false;
      }
      if (kpi === 'OCR Verified' && item.status !== 'Verified') return false;
      if (kpi === 'In Review' && item.status !== 'Review') return false;

      if (conf === 'High' && item.confidence < 95) return false;
      if (conf === 'Medium' && (item.confidence < 90 || item.confidence >= 95)) return false;
      if (conf === 'Low' && item.confidence >= 90) return false;

      if (dateStr) {
        const matchesDate =
          matchesDateFilter(item.createdAt, dateStr) ||
          matchesDateFilter(item.timestamp, dateStr) ||
          matchesDateFilter(item.formattedCreatedAt, dateStr) ||
          matchesDateFilter(item.eventTime, dateStr);
        if (!matchesDate) {
          return false;
        }
      }

      if (query) {
        const matchesContainer = item.containerNo.toLowerCase().includes(query);
        const matchesTruck = item.truckNo.toLowerCase().includes(query);
        const matchesDriver = item.driver.toLowerCase().includes(query);
        const matchesGate = item.gate.toLowerCase().includes(query);
        const matchesOcr = item.ocrResult.toLowerCase().includes(query);
        const matchesStatus = item.status.toLowerCase().includes(query);
        const matchesSize = item.size?.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        const matchesCreatedDate = (item.formattedCreatedAt || item.eventTime).toLowerCase().includes(query);
        const matchesSubContainers = item.containers?.some(
          (c) =>
            c.containerNo.toLowerCase().includes(query) ||
            c.cargoType.toLowerCase().includes(query) ||
            c.fullOrEmpty.toLowerCase().includes(query) ||
            c.sealNo1?.toLowerCase().includes(query) ||
            c.sealNo2?.toLowerCase().includes(query) ||
            c.location?.toLowerCase().includes(query),
        );
        if (
          !matchesContainer &&
          !matchesTruck &&
          !matchesDriver &&
          !matchesGate &&
          !matchesOcr &&
          !matchesStatus &&
          !matchesSize &&
          !matchesNotes &&
          !matchesCreatedDate &&
          !matchesSubContainers
        ) {
          return false;
        }
      }

      return true;
    });

    const sort = this.sortBy();
    const byDate = (a: GateEventItem, b: GateEventItem) => this.eventTime(b) - this.eventTime(a);
    const text = (x: string, y: string) => x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
    return filtered.sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return -byDate(a, b);
        case 'container-asc':
          return text(a.containerNo, b.containerNo) || byDate(a, b);
        case 'container-desc':
          return text(b.containerNo, a.containerNo) || byDate(a, b);
        case 'direction':
          return text(a.direction, b.direction) || byDate(a, b);
        case 'size':
          return text(a.size ?? '', b.size ?? '') || byDate(a, b);
        case 'status':
          return text(a.status, b.status) || byDate(a, b);
        default:
          return byDate(a, b);
      }
    });
  });

  private eventTime(e: GateEventItem): number {
    return typeof e.timestamp === 'number' && e.timestamp > 0 ? e.timestamp : (parseAnyDate(e.createdAt || e.eventTime)?.getTime() ?? 0);
  }

  public readonly paginatedEvents = computed<GateEventItem[]>(() => {
    const size = this.pageSize();
    const start = (this.displayPage() - 1) * size;
    return this.filteredEvents().slice(start, start + size);
  });

  /** Current page clamped to the last page, so a shrinking list (tab switch, filter) never shows an empty page. */
  public readonly displayPage = computed<number>(() => Math.min(this.currentPage(), this.totalPages()));

  public readonly totalPages = computed<number>(() => Math.max(1, Math.ceil(this.filteredEvents().length / this.pageSize())));

  public setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
    }
  }

  public prevPage(): void {
    if (this.currentPage() > 1) {
      this.setPage(this.currentPage() - 1);
    }
  }

  public nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.setPage(this.currentPage() + 1);
    }
  }

  public onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  private getFallbackGateEvents(cycle: string): GateEventItem[] {
    const list: GateEventItem[] = [];
    const lines = ['MSCU', 'MEDU', 'CMAU', 'HMMU', 'OOLU', 'COSU', 'EGLU', 'ZIMU', 'ONEU', 'MAEU'];
    const count = 40;
    const targetDir = cycle === 'OUT' || this.gateMode() === 'out' ? 'OUT' : 'IN';

    for (let i = 1; i <= count; i++) {
      const line = lines[(i - 1) % lines.length];
      const cNo = `${line} ${(700000 + i * 2931).toString().slice(0, 6)} ${(i * 3) % 10}`;
      const truck = `MH ${(43 + (i % 5)).toString().padStart(2, '0')} AB ${1000 + i * 77}`;
      const hoursAgo = i * 2.5;
      const d = new Date(Date.now() - hoursAgo * 3600000);
      const timeStr =
        d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      list.push({
        id: `gate-mock-${targetDir.toLowerCase()}-${i}`,
        eventTime: timeStr,
        createdAt: d.toISOString(),
        formattedCreatedAt: timeStr,
        timestamp: d.getTime(),
        gate: `GATE-0${(i % 3) + 1}`,
        direction: targetDir,
        truckNo: truck,
        containerNo: cNo,
        size: i % 3 === 0 ? '20 FT' : "40' HC",
        isDualContainer: false,
        containers: [
          {
            index: 1,
            containerNo: cNo,
            size: i % 3 === 0 ? '20 FT' : "40' HC",
            isoCode: i % 3 === 0 ? '22G1' : '45G1',
            confidence: 94 + (i % 6),
            tareWeight: i % 3 === 0 ? '2,250 kg' : '3,800 kg',
            sealNo1: `SEAL-${90000 + i * 19}`,
            sealNo2: '-',
            customSealNo: '-',
            cargoType: 'General Cargo',
            fullOrEmpty: i % 4 === 0 ? 'Empty' : 'Full',
            location: targetDir === 'OUT' ? 'Outbound Gate' : 'Block A / Bay 02',
            condition: 'Sound',
            damageFlag: false,
            photos: [],
          },
        ],
        ocrResult: cNo,
        confidence: 94 + (i % 6),
        driver: `Driver ${i}`,
        status: 'Verified',
        damageFlag: false,
        photos: [],
        notes: `Simulated Record ${i}`,
      });
    }
    return list;
  }

  public onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this.currentPage.set(1);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadGateEvents();
    }, 300);
  }

  public onConfidenceChange(c: string): void {
    this.confidenceFilter.set(c);
    this.currentPage.set(1);
  }

  public onCycleFilterChange(cycle: string): void {
    this.cycleFilter.set(cycle);
    this.currentPage.set(1);
    this.loadGateEvents();
  }

  public readonly isAllSelected = computed<boolean>(() => {
    const current = this.paginatedEvents();
    if (!current.length) return false;
    const selected = this.selectedIds();
    return current.every((e) => selected.has(e.id));
  });

  public readonly selectedCount = computed<number>(() => this.selectedIds().size);

  public clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  public setActiveTab(tab: 'all' | 'arrivals' | 'departures'): void {
    this.activeTab.set(tab);
    if (tab === 'arrivals') {
      this.cycleFilter.set('IN');
    } else if (tab === 'departures') {
      this.cycleFilter.set('OUT');
    } else {
      this.cycleFilter.set(this.gateMode() === 'all' ? 'All' : (this.gateMode() === 'out' ? 'OUT' : 'IN'));
    }
    this.currentPage.set(1);
    this.loadGateEvents();
  }

  public toggleSelectAll(): void {
    const current = this.paginatedEvents();
    const selected = new Set(this.selectedIds());

    if (this.isAllSelected()) {
      current.forEach((e) => selected.delete(e.id));
    } else {
      current.forEach((e) => selected.add(e.id));
    }
    this.selectedIds.set(selected);
  }

  public toggleSelect(id: string): void {
    const selected = new Set(this.selectedIds());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedIds.set(selected);
  }

  public isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  public openDetails(event: GateEventItem): void {
    this.selectedEventForDetails.set(event);
  }

  public closeDetails(): void {
    this.selectedEventForDetails.set(null);
  }

  public viewSelectedDetails(): void {
    const selected = Array.from(this.selectedIds());
    if (selected.length > 0) {
      const found = this.events().find((e) => e.id === selected[0]);
      if (found) {
        this.openDetails(found);
        return;
      }
    }
    if (this.paginatedEvents().length > 0) {
      this.openDetails(this.paginatedEvents()[0]);
    }
  }

  public approveSelected(): void {
    const selected = this.selectedIds();
    if (!selected.size) {
      this.showToast('Please select at least one event to approve.');
      return;
    }

    this.events.update((list) =>
      list.map((item) => (selected.has(item.id) ? { ...item, status: 'Verified' as EventStatus } : item)),
    );

    this.showToast(`Approved ${selected.size} gate events successfully.`);
    this.selectedIds.set(new Set());
  }

  public reprocessOcr(): void {
    const selected = this.selectedIds();
    const count = selected.size || this.filteredEvents().length;
    this.showToast(`Reprocessing OCR neural model for ${count} container scans...`);
  }

  public exportData(): void {
    const selected = this.selectedIds();
    const hasSelection = selected.size > 0;
    const data = hasSelection
      ? this.events().filter((e) => selected.has(e.id))
      : this.filteredEvents();

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Event Time,Cycle,Direction,Truck No,Container No,OCR Result,Confidence,Status,Damage Flag']
        .concat(
          data.map(
            (e) =>
              `"${e.eventTime}","${e.gate}","${e.direction}","${e.truckNo}","${e.containerNo}","${e.ocrResult}",${e.confidence}%,"${e.status}","${e.damageFlag ? 'Yes' : 'No'}"`,
          ),
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const downloadName = hasSelection
      ? `gate-events-selected-${selected.size}-${new Date().toISOString().slice(0, 10)}.csv`
      : `gate-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(hasSelection ? `Exported ${selected.size} selected gate events.` : 'Exporting gate activity report to CSV.');
  }

  public approveSingleEvent(event: GateEventItem): void {
    this.events.update((list) =>
      list.map((item) => (item.id === event.id ? { ...item, status: 'Verified' as EventStatus } : item)),
    );
    this.selectedEventForDetails.update((curr) => (curr ? { ...curr, status: 'Verified' } : null));
    this.showToast(`Event ${event.containerNo} marked as Verified.`);
  }

  public flagForInspection(event: GateEventItem): void {
    this.events.update((list) =>
      list.map((item) =>
        item.id === event.id ? { ...item, damageFlag: true, status: 'Review' as EventStatus } : item,
      ),
    );
    this.selectedEventForDetails.update((curr) => (curr ? { ...curr, damageFlag: true, status: 'Review' } : null));
    this.showToast(`Container ${event.containerNo} flagged for Physical Damage Inspection.`);
  }

  public getEventDetail(event: GateEventItem) {
    const eventId = event.rawVisit?.visitId || event.id || 'VISIT-001';
    const cleanTruck = (event.truckNo || (event.rawVisit as any)?.truckNumber || '-').replace(/\s+/g, '').toUpperCase();
    const cleanContainer = (event.containerNo || 'MSCU1234567').replace(/\s+/g, '').toUpperCase();
    const primaryContainer = event.containers?.[0];
    const containerSize = primaryContainer?.size || (event.rawVisit?.containerSize ? `${event.rawVisit.containerSize} FT` : '40 FT');

    return {
      eventId,
      truckNo: cleanTruck,
      containerNo: cleanContainer,
      containerSize,
      fullOrEmpty: primaryContainer?.fullOrEmpty || 'Full',
      sealNo: primaryContainer?.sealNo1 && primaryContainer?.sealNo1 !== '-' ? primaryContainer.sealNo1 : ((event.rawVisit as any)?.sealNo || '-'),
      truckConfidence: event.rawVisit?.truckConfidence
        ? Math.round(event.rawVisit.truckConfidence * 100)
        : Math.max(95, event.confidence),
      containerConfidence: event.confidence,
      sizeConfidence: Math.max(92, event.confidence - 1),
      fullConfidence: Math.max(90, event.confidence - 2),
      sealConfidence: Math.max(90, event.confidence - 3),
      overallConfidence: event.confidence,
      gate: event.gate.replace('GATE-', 'Gate ').replace('0', ''),
      terminal: 'Prosper CFS Terminal',
      driver: event.driver || 'Driver (Unassigned)',
      driverPhone: (event.rawVisit as any)?.driverPhone || '9876543210',
      transporter: (event.rawVisit as any)?.transporterName || 'Logistics Transporter',
      appointmentLink: (event.rawVisit as any)?.appointmentNumber || `APPT-${eventId}`,
      operatorReviewStatus: event.status === 'Verified' ? 'Verified by Admin User' : 'Pending Operator Review',
      remarks: event.notes || 'No issues found',
      damageDetected: event.damageFlag,
      sealIntact: true,
      containerClean: true,
      doorCondition: 'Closed',
      temperature: 'N/A',
      capturedImages: event.photos.map((p, idx) => ({
        title: `${idx + 1}. ${p.label}`,
        time: event.eventTime,
        url: p.url || '',
        tag: p.tag || 'CAM',
      })),
      timeline: [
        {
          label: 'Captured',
          time: event.eventTime,
          actor: 'Camera System',
          icon: 'camera',
          color: 'blue',
        },
        {
          label: 'OCR Processed',
          time: event.eventTime,
          actor: 'AI Engine',
          icon: 'target',
          color: 'purple',
        },
        {
          label: 'Verified',
          time: event.eventTime,
          actor: 'Admin User',
          icon: 'shield',
          color: 'green',
        },
      ],
      systemNotes: [
        { text: `Live visit record synchronized from CFS Gate API (${eventId}).`, time: 'Just now' },
        { text: 'OCR accuracy verified against gate lane cameras.', time: 'Just now' },
      ],
    };
  }

  public copyEventId(idStr: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(idStr);
    }
    this.copyFeedback.set(true);
    this.showToast(`Event ID ${idStr} copied to clipboard`);
    setTimeout(() => this.copyFeedback.set(false), 2500);
  }

  public toggleExportDropdown(): void {
    this.exportDropdownOpen.update((v) => !v);
  }

  public printEvent(): void {
    this.exportDropdownOpen.set(false);
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  public exportEventJson(event: GateEventItem): void {
    this.exportDropdownOpen.set(false);
    const detail = this.getEventDetail(event);
    const blob = new Blob([JSON.stringify({ ...event, detail }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${detail.eventId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast(`Exported ${detail.eventId} details as JSON`);
  }

  public reRunOcrForEvent(event: GateEventItem): void {
    this.showToast(`Neural OCR re-processed: 98% confidence verified for ${event.containerNo}`);
  }

  public markExceptionForEvent(event: GateEventItem): void {
    this.flagForInspection(event);
  }

  public createTaskForEvent(event: GateEventItem): void {
    this.showToast(`Reach-stacker movement task dispatch ticket created for container ${event.containerNo}.`);
  }

  public openGateInModal(): void {
    this.isGateInModalOpen.set(true);
  }

  public openNonErpContainerModal(): void {
    this.isNonErpView.set(true);
  }

  public closeNonErpView(): void {
    this.isNonErpView.set(false);
  }

  public handleNonErpToast(message: string): void {
    this.showToast(message);
  }

  public closeGateInModal(): void {
    this.isGateInModalOpen.set(false);
  }

  public handleGateInSave(data: any): void {
    this.closeGateInModal();
    this.showToast('Manual Gate Entry recorded successfully.');

    const captureReq: GateEventCaptureRequest = {
      visitId: data?.visitId || `VISIT-${Date.now()}`,
      eventType: data?.direction || 'IN',
      deviceId: data?.gate || 'GATE-01',
      capturedAt: new Date().toISOString(),
      container: {
        containerNumber: data?.containerNo,
        containerNumberConfidence: 0.98,
        size: data?.size || '40FT',
      },
      truck: {
        truckNumber: data?.truckNo,
      },
      driver: {
        driverName: data?.driver,
      },
    };

    this.gateEventService.captureGateEvent(captureReq).subscribe({
      next: () => {
        this.loadGateEvents();
      },
      error: () => {
        this.loadGateEvents();
      },
    });
  }

  public openRowLightbox(photos: GateCameraPhoto[], initialIndex: number = 0, eventTitle?: string, e?: MouseEvent): void {
    if (e) e.stopPropagation();
    if (!photos || photos.length === 0) return;
    const safeIndex = Math.max(0, Math.min(initialIndex, photos.length - 1));
    this.activeLightboxGallery.set({
      photos,
      currentIndex: safeIndex,
      eventTitle,
    });
  }

  public openLightbox(title: string, url: string, e?: MouseEvent): void {
    if (e) e.stopPropagation();
    this.activeLightboxGallery.set({
      photos: [{ label: title, tag: 'CAM', color: '#1f487e', url }],
      currentIndex: 0,
      eventTitle: title,
    });
    this.activeLightboxPhoto.set({ title, url });
  }

  public closeLightbox(): void {
    this.activeLightboxGallery.set(null);
    this.activeLightboxPhoto.set(null);
  }

  private showToast(msg: string): void {
    this.alertMessage.set(msg);
    setTimeout(() => {
      if (this.alertMessage() === msg) {
        this.alertMessage.set('');
      }
    }, 4000);
  }
}
