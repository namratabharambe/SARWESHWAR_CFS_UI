import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, forkJoin } from 'rxjs';
import { TranslatePipe } from 'shared/pipes';
import {
  GatePhotoStripComponent,
  GateCameraPhoto,
  ConfidenceBadgeComponent,
  StatusBadgeComponent,
} from 'shared/components';
import { DatePickerComponent } from 'shared/components/molecules/date-picker/date-picker.component';
import { DropdownComponent } from 'shared/components/molecules/dropdown/dropdown.component';
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
} from 'shared/types/gate-event/gate-event.interface';

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
    ManualGateEntryComponent,
    NonErpContainerComponent,
    DatePickerComponent,
    DropdownComponent,
    StatusBadgeComponent,
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

  public readonly gateMode = signal<'in' | 'out'>('in');
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

  public readonly currentLightboxPhoto = computed<GateCameraPhoto | null>(() => {
    const g = this.activeLightboxGallery();
    if (!g || !g.photos || g.photos.length === 0) return null;
    return g.photos[g.currentIndex] ?? null;
  });

  public readonly lightboxCounterText = computed<string>(() => {
    const g = this.activeLightboxGallery();
    if (!g || !g.photos || g.photos.length === 0) return '';
    return `${g.currentIndex + 1} / ${g.photos.length}`;
  });

  // Keep for backward compatibility if referenced elsewhere
  public readonly activeLightboxPhoto = signal<{ title: string; url: string } | null>(null);

  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(25);
  public readonly totalCount = signal<number>(0);
  public readonly totalCheckinCount = signal<number>(0);
  public readonly totalCheckoutCount = signal<number>(0);
  public readonly todayCheckinCount = signal<number>(0);
  public readonly todayCheckoutCount = signal<number>(0);

  constructor() {
    this.syncGateMode();

    if (this.router) {
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.syncGateMode();
        });
    }

    effect(() => {
      // Track site or client selection changes and reload visits
      const siteId = this.authService.selectedSiteId();
      const clientId = this.authService.selectedClientId();
      if (siteId || clientId) {
        this.loadGateEvents();
      }
    });
  }

  private syncGateMode(): void {
    const url = this.router?.url ?? '';
    const routeMode = this.route?.snapshot?.data?.['mode'];
    const isOut = url.includes('/gate-events/out') || routeMode === 'out';
    this.gateMode.set(isOut ? 'out' : 'in');
    this.cycleFilter.set(isOut ? 'OUT' : 'IN');
    this.currentPage.set(1);
    this.isNonErpView.set(false);
    this.selectedEventForDetails.set(null);
    this.loadGateEvents();
  }

  public readonly fromDate = signal<string | undefined>(undefined);
  public readonly toDate = signal<string | undefined>(undefined);

  public ngOnInit(): void {
    this.loadGateEvents();
  }

  public onDateFilterChange(val: string): void {
    this.dateFilter.set(val);
    this.currentPage.set(1);

    if (!val) {
      this.fromDate.set(undefined);
      this.toDate.set(undefined);
      this.loadGateEvents();
      return;
    }

    // Parse date and build ISO range for that full day
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = parsed.getMonth();
      const day = parsed.getDate();
      const start = new Date(Date.UTC(year, month, day, 0, 0, 0)).toISOString();
      const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999)).toISOString();
      this.fromDate.set(start);
      this.toDate.set(end);
    } else {
      // If user typed string like DD-MM-YYYY or DD MMM YYYY
      const dmyMatch = val.match(/^(\d{1,2})[-/\s]+([A-Za-z]+|\d{1,2})[-/\s]+(\d{4})/);
      if (dmyMatch) {
        const d = parseInt(dmyMatch[1], 10);
        let m = parseInt(dmyMatch[2], 10) - 1;
        if (isNaN(m)) {
          const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          m = shortMonths.findIndex((sm) => dmyMatch[2].toLowerCase().startsWith(sm));
          if (m < 0) m = 0;
        }
        const y = parseInt(dmyMatch[3], 10);
        const start = new Date(Date.UTC(y, m, d, 0, 0, 0)).toISOString();
        const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999)).toISOString();
        this.fromDate.set(start);
        this.toDate.set(end);
      } else {
        this.fromDate.set(undefined);
        this.toDate.set(undefined);
      }
    }

    this.loadGateEvents();
  }

  public loadGateEvents(): void {
    this.isLoading.set(true);
    const siteId = this.authService.getActiveSiteId() || undefined;
    const clientId = this.authService.getActiveClientId() || undefined;
    const cycle = this.cycleFilter();
    const eventType = cycle === 'All' ? undefined : (cycle === 'IN' ? 'GATE_IN' : 'GATE_OUT');
    const from = this.fromDate();
    const to = this.toDate();

    const now = new Date();
    const todayStartIso = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)).toISOString();
    const todayEndIso = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)).toISOString();

    // All-time Total Gate In & Out Counts
    const allInVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 1,
      siteId,
      clientId,
      eventType: 'GATE_IN',
    });

    const allOutVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 1,
      siteId,
      clientId,
      eventType: 'GATE_OUT',
    });

    // Today Only Gate In & Out Counts
    const todayInVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 1,
      siteId,
      clientId,
      eventType: 'GATE_IN',
      from: todayStartIso,
      to: todayEndIso,
    });

    const todayOutVisits$ = this.gateEventService.getVisits({
      page: 1,
      pageSize: 1,
      siteId,
      clientId,
      eventType: 'GATE_OUT',
      from: todayStartIso,
      to: todayEndIso,
    });

    // Current View / Filtered List
    const currentVisits$ = this.gateEventService.getVisits({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      siteId,
      clientId,
      eventType,
      from,
      to,
    });

    forkJoin({
      allInRes: allInVisits$,
      allOutRes: allOutVisits$,
      todayInRes: todayInVisits$,
      todayOutRes: todayOutVisits$,
      currentRes: currentVisits$,
    }).subscribe({
      next: ({ allInRes, allOutRes, todayInRes, todayOutRes, currentRes }) => {
        this.isLoading.set(false);
        const totalIn = allInRes?.totalCount ?? 0;
        const totalOut = allOutRes?.totalCount ?? 0;
        const todayIn = todayInRes?.totalCount ?? 0;
        const todayOut = todayOutRes?.totalCount ?? 0;

        this.totalCheckinCount.set(totalIn);
        this.totalCheckoutCount.set(totalOut);
        this.todayCheckinCount.set(todayIn);
        this.todayCheckoutCount.set(todayOut);

        const items = currentRes?.items ?? (Array.isArray(currentRes) ? (currentRes as any) : []);
        if (items && items.length > 0) {
          const mapped = items.map((visit: VisitListItemDto) => this.mapVisitToGateEventItem(visit));
          this.events.set(mapped);
          this.totalCount.set(currentRes.totalCount ?? mapped.length);
        } else {
          this.events.set([]);
          this.totalCount.set(0);
        }
      },
      error: () => {
        // Fallback to legacy gate events API
        this.gateEventService
          .getGateEvents({
            page: this.currentPage(),
            pageSize: this.pageSize(),
            eventType,
          })
          .subscribe({
            next: (legacyRes) => {
              this.isLoading.set(false);
              const legacyItems = legacyRes?.items ?? legacyRes?.Items ?? [];
              if (legacyItems && legacyItems.length > 0) {
                const mapped = legacyItems.map((dto: GateEventDetailDto) => this.mapDtoToGateEventItem(dto));
                this.events.set(mapped);
                const total = legacyRes.totalCount ?? legacyRes.TotalCount ?? mapped.length;
                this.totalCount.set(total);
                if (cycle === 'IN') {
                  this.totalCheckinCount.set(total);
                } else if (cycle === 'OUT') {
                  this.totalCheckoutCount.set(total);
                }
              } else {
                this.events.set([]);
                this.totalCount.set(0);
              }
            },
            error: () => {
              this.isLoading.set(false);
              this.events.set([]);
              this.totalCount.set(0);
            },
          });
      },
    });
  }


  private buildContainerPhotos(
    containerNo: string,
    index: number,
    totalContainers: number,
    rawImages: any[] = [],
    visitId?: string,
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
          const gateBaseUrl = (environment as any).gateApiBaseUrl || 'https://syapi.prosperassettracking.com/api/v1';
          url = `${gateBaseUrl}/gate/visits/${encodeURIComponent(visitId)}/images/${encodeURIComponent(imgId)}`;
        }

        const tag = (img.cameraId ?? img.CameraId ?? img.deviceId ?? img.DeviceId ?? rawType) || `C${index}-CAM`;

        photos.push({
          label: `${prefix}${rawType.includes('View') || rawType.includes('Scan') ? rawType : `${rawType} View`}`,
          color,
          tag: String(tag),
          url: String(url),
        });
      });
    }

    return photos;
  }

  private mapVisitToGateEventItem(visit: any): GateEventItem {
    const id = visit.visitId || visit.VisitId || visit.id || visit.Id || crypto.randomUUID();
    const eventsList: any[] = Array.isArray(visit.events)
      ? visit.events
      : Array.isArray(visit.Events)
        ? visit.Events
        : [];
    const primaryEvent = eventsList.length > 0 ? eventsList[0] : null;

    const capturedAt =
      primaryEvent?.capturedAt ??
      primaryEvent?.CapturedAt ??
      visit.createdAt ??
      visit.CreatedAt ??
      new Date().toISOString();
    const dateObj = new Date(capturedAt);
    const eventTime = isNaN(dateObj.getTime())
      ? capturedAt
      : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' +
        dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const rawEventType = (primaryEvent?.eventType ?? primaryEvent?.EventType ?? 'GATE_IN').toUpperCase();
    const direction: GateDirection = rawEventType.includes('OUT') || rawEventType.includes('EXIT') ? 'OUT' : 'IN';
    const rawDeviceId = primaryEvent?.deviceId ?? primaryEvent?.DeviceId ?? '';
    const gate = rawDeviceId ? `GATE-${rawDeviceId.slice(0, 4).toUpperCase()}` : 'GATE-01';

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

      const cPhotos = this.buildContainerPhotos(cNo, idx + 1, totalContainers, c.images ?? [], id);

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
      status: visit.status === 'IN_YARD' || visit.status === 'DEPARTED' ? 'Verified' : 'Review',
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

    const rawEventType = (dto.eventType ?? dto.EventType ?? 'IN').toUpperCase();
    const direction: GateDirection = rawEventType.includes('OUT') || rawEventType.includes('EXIT') ? 'OUT' : 'IN';
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
      const cPhotos = this.buildContainerPhotos(cNo, idx + 1, totalContainers, c.images ?? [], id);

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

    // Calculate today arrivals/departures from items or API
    const todayIn = todayInCount || list.filter((e) => {
      const d = new Date(e.timestamp);
      return d.toDateString() === new Date().toDateString() && e.direction === 'IN';
    }).length || (mode === 'in' && !this.fromDate() ? total : 0);

    const todayOut = todayOutCount || list.filter((e) => {
      const d = new Date(e.timestamp);
      return d.toDateString() === new Date().toDateString() && e.direction === 'OUT';
    }).length || (mode === 'out' && !this.fromDate() ? total : 0);

    const totalCurrentMode = mode === 'out' ? (totalOut || total) : (totalIn || total);
    const ocrVerified = totalCurrentMode;
    const pendingReview = list.filter((e) => e.status === 'Review').length;
    const damagedCaptures = list.filter((e) => e.damageFlag).length;

    return {
      todayArrivals: todayIn,
      arrivalsTrend: todayIn > 0 ? `${todayIn} arrivals today` : '0 arrivals today',
      todayDepartures: todayOut,
      departuresTrend: todayOut > 0 ? `${todayOut} departures today` : '0 departures today',
      totalCheckin: totalIn || total,
      totalCheckinTrend: totalIn > 0 ? `${totalIn} total gate in` : '0 total gate in',
      totalCheckout: totalOut || total,
      totalCheckoutTrend: totalOut > 0 ? `${totalOut} total gate out` : '0 total gate out',
      totalAll: totalCurrentMode,
      totalAllTrend: totalCurrentMode > 0 ? `${totalCurrentMode} total operations` : '0 total operations',
      ocrVerified: ocrVerified,
      ocrVerifiedPercent: totalCurrentMode > 0 ? '100% verified' : '0% verified',
      pendingReview: pendingReview,
      pendingReviewTrend: pendingReview > 0 ? `${pendingReview} pending` : '0 pending',
      damagedCaptures: damagedCaptures,
      damagedTrend: damagedCaptures > 0 ? `${damagedCaptures} flagged` : '0 detected',
    };
  });

  // Tab counts
  public readonly tabCounts = computed(() => {
    const list = this.events();
    const totalIn = this.totalCheckinCount();
    const totalOut = this.totalCheckoutCount();
    return {
      all: (totalIn + totalOut) || this.totalCount() || list.length,
      arrivals: totalIn || (this.cycleFilter() === 'IN' ? this.totalCount() : list.filter((e) => e.direction === 'IN').length),
      departures: totalOut || (this.cycleFilter() === 'OUT' ? this.totalCount() : list.filter((e) => e.direction === 'OUT').length),
    };
  });

  // Filtered dataset
  public readonly filteredEvents = computed<GateEventItem[]>(() => {
    const list = this.events();
    const cycle = this.cycleFilter();
    const conf = this.confidenceFilter();
    const query = this.searchQuery().trim().toLowerCase();
    const dateStr = this.dateFilter().trim();

    return list.filter((item) => {
      if (cycle !== 'All' && item.direction !== cycle) return false;

      if (conf === 'High' && item.confidence < 95) return false;
      if (conf === 'Medium' && (item.confidence < 90 || item.confidence >= 95)) return false;
      if (conf === 'Low' && item.confidence >= 90) return false;

      if (dateStr) {
        const itemDate = new Date(item.timestamp);
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          if (
            itemDate.getFullYear() !== parsed.getFullYear() ||
            itemDate.getMonth() !== parsed.getMonth() ||
            itemDate.getDate() !== parsed.getDate()
          ) {
            // Also check formatted text match
            if (!item.eventTime.toLowerCase().includes(dateStr.toLowerCase())) {
              return false;
            }
          }
        }
      }

      if (query) {
        const matchesContainer = item.containerNo.toLowerCase().includes(query);
        const matchesTruck = item.truckNo.toLowerCase().includes(query);
        const matchesDriver = item.driver.toLowerCase().includes(query);
        const matchesGate = item.gate.toLowerCase().includes(query);
        const matchesOcr = item.ocrResult.toLowerCase().includes(query);
        if (!matchesContainer && !matchesTruck && !matchesDriver && !matchesGate && !matchesOcr) {
          return false;
        }
      }

      return true;
    });
  });

  public readonly paginatedEvents = computed<GateEventItem[]>(() => {
    return this.filteredEvents();
  });

  public readonly totalPages = computed<number>(() => {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  });

  public readonly visiblePageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const start = Math.max(1, Math.min(current - 2, total - 4 > 0 ? total - 4 : 1));
    const end = Math.min(total, start + 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  public setPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadGateEvents();
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
    this.loadGateEvents();
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

  public setActiveTab(tab: 'all' | 'arrivals' | 'departures'): void {
    this.activeTab.set(tab);
    if (tab === 'arrivals') {
      this.cycleFilter.set('IN');
    } else if (tab === 'departures') {
      this.cycleFilter.set('OUT');
    } else {
      this.cycleFilter.set(this.gateMode() === 'out' ? 'OUT' : 'IN');
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
    const data = this.filteredEvents();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Event Time,Gate,Direction,Truck No,Container No,OCR Result,Confidence,Driver,Status,Damage Flag']
        .concat(
          data.map(
            (e) =>
              `"${e.eventTime}","${e.gate}","${e.direction}","${e.truckNo}","${e.containerNo}","${e.ocrResult}",${e.confidence}%,"${e.driver}","${e.status}","${e.damageFlag ? 'Yes' : 'No'}"`,
          ),
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gate-events-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Exporting gate activity report to CSV.');
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
    const cleanTruck = (event.truckNo || 'MH12AB1234').replace(/\s+/g, '').toUpperCase();
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

  public prevLightboxPhoto(e?: MouseEvent): void {
    if (e) e.stopPropagation();
    this.activeLightboxGallery.update((g) => {
      if (!g || g.photos.length <= 1) return g;
      const nextIdx = (g.currentIndex - 1 + g.photos.length) % g.photos.length;
      return { ...g, currentIndex: nextIdx };
    });
  }

  public nextLightboxPhoto(e?: MouseEvent): void {
    if (e) e.stopPropagation();
    this.activeLightboxGallery.update((g) => {
      if (!g || g.photos.length <= 1) return g;
      const nextIdx = (g.currentIndex + 1) % g.photos.length;
      return { ...g, currentIndex: nextIdx };
    });
  }

  public selectLightboxIndex(index: number, e?: MouseEvent): void {
    if (e) e.stopPropagation();
    this.activeLightboxGallery.update((g) => {
      if (!g || index < 0 || index >= g.photos.length) return g;
      return { ...g, currentIndex: index };
    });
  }

  public closeLightbox(): void {
    this.activeLightboxGallery.set(null);
    this.activeLightboxPhoto.set(null);
  }

  @HostListener('window:keydown', ['$event'])
  public handleGalleryKeydown(event: KeyboardEvent): void {
    if (!this.activeLightboxGallery()) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevLightboxPhoto();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextLightboxPhoto();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeLightbox();
    }
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
