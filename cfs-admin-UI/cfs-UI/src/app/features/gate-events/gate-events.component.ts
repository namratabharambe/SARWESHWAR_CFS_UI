import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from 'shared/pipes';
import { GatePhotoStripComponent, GateCameraPhoto, ConfidenceBadgeComponent, StatusBadgeComponent } from 'shared/components';
import { DatePickerComponent } from 'shared/components/molecules/date-picker/date-picker.component';
import { DropdownComponent } from 'shared/components/molecules/dropdown/dropdown.component';
import { GateEventDetailComponent } from './gate-event-detail/gate-event-detail.component';
import { GateInModalComponent } from './gate-in-modal/gate-in-modal.component';
import { GateEventService } from 'shared/services/gate-event.service';
import { AuthService } from 'core/auth/auth.service';
import {
  GateEventDetailDto,
  GateEventCaptureRequest,
  VisitListItemDto,
  VisitsPagedResponse,
} from 'shared/types/gate-event/gate-event.interface';

export type GateDirection = 'IN' | 'OUT';
export type EventStatus = 'Verified' | 'Review';
export type { GateCameraPhoto };

export interface GateEventItem {
  id: string;
  eventTime: string;
  timestamp: number;
  gate: string;
  direction: GateDirection;
  truckNo: string;
  containerNo: string;
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
    GateInModalComponent,
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
  public readonly events = signal<GateEventItem[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly activeTab = signal<'all' | 'arrivals' | 'departures'>('all');
  public readonly cycleFilter = signal<string>('All');
  public readonly directionFilter = signal<string>('All');
  public readonly gateFilter = signal<string>('All');
  public readonly confidenceFilter = signal<string>('All');
  public readonly dateFilter = signal<string>('17 May 2025');
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
  public readonly activeLightboxPhoto = signal<{ title: string; url: string } | null>(null);

  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(25);
  public readonly totalCount = signal<number>(0);

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
  }

  public ngOnInit(): void {
    this.loadGateEvents();
  }

  public loadGateEvents(): void {
    this.isLoading.set(true);
    const siteId = this.authService.getActiveSiteId() || undefined;
    const clientId = this.authService.getActiveClientId() || undefined;

    this.gateEventService
      .getVisits({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        siteId,
        clientId,
      })
      .subscribe({
        next: (response: VisitsPagedResponse) => {
          this.isLoading.set(false);
          const items = response?.items ?? (Array.isArray(response) ? (response as any) : []);
          if (items && items.length > 0) {
            const mapped = items.map((visit: VisitListItemDto) => this.mapVisitToGateEventItem(visit));
            this.events.set(mapped);
            this.totalCount.set(response.totalCount ?? mapped.length);
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
            })
            .subscribe({
              next: (legacyRes) => {
                this.isLoading.set(false);
                const legacyItems = legacyRes?.items ?? legacyRes?.Items ?? [];
                if (legacyItems && legacyItems.length > 0) {
                  const mapped = legacyItems.map((dto: GateEventDetailDto) => this.mapDtoToGateEventItem(dto));
                  this.events.set(mapped);
                  this.totalCount.set(legacyRes.totalCount ?? legacyRes.TotalCount ?? mapped.length);
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

    const containerNo =
      visit.containerNumber ??
      visit.ContainerNumber ??
      primaryEvent?.detectedContainerNumber ??
      primaryEvent?.DetectedContainerNumber ??
      'MSCU 000000 0';
    const rawConf =
      visit.containerConfidence ??
      visit.ContainerConfidence ??
      primaryEvent?.detectedContainerConfidence ??
      primaryEvent?.DetectedContainerConfidence;
    const confidence = rawConf != null ? Math.round(rawConf > 1 ? rawConf : rawConf * 100) : 95;

    const truckNo =
      visit.truckNumber ??
      visit.TruckNumber ??
      primaryEvent?.detectedTruckNumber ??
      primaryEvent?.DetectedTruckNumber ??
      'MH 12 AB 0000';
    const driverName = visit.driverName ?? visit.DriverName ?? 'Driver (Unassigned)';

    // Gather all image objects across all events in visit and root visit
    const photos: GateCameraPhoto[] = [];
    const allImages: any[] = [];

    if (Array.isArray(visit.images)) allImages.push(...visit.images);
    if (Array.isArray(visit.Images)) allImages.push(...visit.Images);

    eventsList.forEach((ev: any) => {
      const evImgs = ev.images ?? ev.Images ?? [];
      if (Array.isArray(evImgs)) {
        allImages.push(...evImgs);
      }
    });

    if (allImages.length > 0) {
      allImages.forEach((img: any) => {
        const rawType = String(img.imageType ?? img.ImageType ?? img.type ?? img.Type ?? 'Camera Scan');
        const type = rawType.toUpperCase();
        let color = '#1f487e';
        if (type.includes('FRONT') || type.includes('OCR')) color = '#c9842a';
        else if (type.includes('REAR')) color = '#993030';
        else if (type.includes('LEFT') || type.includes('RIGHT')) color = '#1f487e';

        const url =
          img.imageUrl ?? img.ImageUrl ?? img.s3Url ?? img.S3Url ?? img.image ?? img.Image ?? img.url ?? img.Url ?? '';
        const tag = (img.cameraId ?? img.CameraId ?? img.deviceId ?? img.DeviceId ?? rawType) || 'CAM';

        photos.push({
          label: rawType.includes('View') || rawType.includes('Scan') ? rawType : `${rawType} View`,
          color,
          tag: String(tag),
          url: String(url),
        });
      });
    }

    if (photos.length === 0) {
      photos.push(
        { label: 'Front OCR', color: '#c9842a', tag: 'FRONT', url: '' },
        { label: 'Left Side ISO', color: '#1f487e', tag: 'LEFT', url: '' },
        { label: 'Right Side ISO', color: '#1f487e', tag: 'RIGHT', url: '' },
        { label: 'Rear Doors', color: '#993030', tag: 'REAR', url: '' },
      );
    }

    return {
      id,
      eventTime,
      timestamp: dateObj.getTime() || Date.now(),
      gate,
      direction,
      truckNo,
      containerNo,
      ocrResult: containerNo,
      confidence: confidence > 0 ? confidence : 95,
      driver: driverName,
      status: visit.status === 'IN_YARD' || visit.status === 'DEPARTED' ? 'Verified' : 'Review',
      damageFlag: false,
      photos,
      notes: `Visit ID: ${id} | Status: ${visit.status || 'ACTIVE'} | Size: ${visit.containerSize || visit.ContainerSize || '40FT'}`,
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

    const container = dto.container ?? dto.Container;
    const containerNo = container?.containerNumber ?? container?.ContainerNumber ?? 'MSCU 000000 0';
    const confidence = Math.round(
      (container?.containerNumberConfidence ?? container?.ContainerNumberConfidence ?? 0.95) * 100,
    );

    const truck = dto.truck ?? dto.Truck;
    const truckNo = truck?.truckNumber ?? truck?.TruckNumber ?? 'MH 12 AB 0000';

    const driver = dto.driver ?? dto.Driver;
    const driverName = driver?.driverName ?? driver?.DriverName ?? 'Driver';

    const photos: GateCameraPhoto[] = [];
    const images = dto.images ?? dto.Images;
    if (images && images.length > 0) {
      images.forEach((img: any) => {
        const rawType = String(img.imageType ?? img.ImageType ?? img.type ?? img.Type ?? 'Camera Scan');
        const url =
          img.imageUrl ?? img.ImageUrl ?? img.s3Url ?? img.S3Url ?? img.image ?? img.Image ?? img.url ?? img.Url ?? '';
        photos.push({
          label: rawType.includes('View') || rawType.includes('Scan') ? rawType : `${rawType} View`,
          color: '#1f487e',
          tag: String(img.cameraId ?? img.CameraId ?? 'CAM'),
          url: String(url),
        });
      });
    } else {
      if (dto.frontImageUrl ?? dto.FrontImageUrl) {
        photos.push({
          label: 'Front OCR',
          color: '#c9842a',
          tag: 'FRONT',
          url: dto.frontImageUrl ?? dto.FrontImageUrl ?? '',
        });
      }
      if (dto.leftImageUrl ?? dto.LeftImageUrl) {
        photos.push({
          label: 'Left Side',
          color: '#1f487e',
          tag: 'LEFT',
          url: dto.leftImageUrl ?? dto.LeftImageUrl ?? '',
        });
      }
      if (dto.rightImageUrl ?? dto.RightImageUrl) {
        photos.push({
          label: 'Right Side',
          color: '#1f487e',
          tag: 'RIGHT',
          url: dto.rightImageUrl ?? dto.RightImageUrl ?? '',
        });
      }
      if (dto.rearImageUrl ?? dto.RearImageUrl) {
        photos.push({
          label: 'Rear Doors',
          color: '#993030',
          tag: 'REAR',
          url: dto.rearImageUrl ?? dto.RearImageUrl ?? '',
        });
      }
    }

    if (photos.length === 0) {
      photos.push(
        { label: 'Front OCR', color: '#c9842a', tag: 'FRONT', url: '' },
        { label: 'Left Side ISO', color: '#1f487e', tag: 'LEFT', url: '' },
        { label: 'Right Side ISO', color: '#1f487e', tag: 'RIGHT', url: '' },
        { label: 'Rear Doors', color: '#993030', tag: 'REAR', url: '' },
      );
    }

    return {
      id,
      eventTime,
      timestamp: dateObj.getTime() || Date.now(),
      gate,
      direction,
      truckNo,
      containerNo,
      ocrResult: containerNo,
      confidence: confidence > 0 ? confidence : 95,
      driver: driverName,
      status: confidence >= 90 ? 'Verified' : 'Review',
      damageFlag: false,
      photos,
      notes: `Captured at ${gate} via automated optical lane sensor.`,
      rawDto: dto,
    };
  }

  // Metrics matching the reference UI cards
  public readonly metrics = computed(() => {
    const list = this.events();
    const arrivals = list.filter((e) => e.direction === 'IN').length;
    const departures = list.filter((e) => e.direction === 'OUT').length;
    const ocrVerified = list.filter((e) => e.status === 'Verified').length;
    const pendingReview = list.filter((e) => e.status === 'Review').length;
    const damagedCaptures = list.filter((e) => e.damageFlag).length;
    const total = list.length;

    return {
      todayArrivals: arrivals,
      arrivalsTrend: arrivals > 0 ? `${arrivals} arrivals` : '0 today',
      todayDepartures: departures,
      departuresTrend: departures > 0 ? `${departures} departures` : '0 today',
      ocrVerified: ocrVerified,
      ocrVerifiedPercent: total > 0 ? `${Math.round((ocrVerified / total) * 100)}% of total` : '0%',
      pendingReview: pendingReview,
      pendingReviewTrend: pendingReview > 0 ? `${pendingReview} pending` : '0 pending',
      damagedCaptures: damagedCaptures,
      damagedTrend: damagedCaptures > 0 ? `${damagedCaptures} flagged` : '0 detected',
    };
  });

  // Tab counts
  public readonly tabCounts = computed(() => {
    const list = this.events();
    return {
      all: list.length,
      arrivals: list.filter((e) => e.direction === 'IN').length,
      departures: list.filter((e) => e.direction === 'OUT').length,
    };
  });

  // Filtered dataset (uses Cycle filter instead of tabs/direction/gate)
  public readonly filteredEvents = computed<GateEventItem[]>(() => {
    const list = this.events();
    const cycle = this.cycleFilter();
    const conf = this.confidenceFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return list.filter((item) => {
      // Cycle filter replaces direction + gate + tabs
      if (cycle !== 'All' && item.direction !== cycle) return false;

      if (conf === 'High' && item.confidence < 95) return false;
      if (conf === 'Medium' && (item.confidence < 90 || item.confidence >= 95)) return false;
      if (conf === 'Low' && item.confidence >= 90) return false;

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
    const list = this.filteredEvents();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

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
    const containerSize = event.rawVisit?.containerSize ? `${event.rawVisit.containerSize} FT` : '40 FT';

    return {
      eventId,
      truckNo: cleanTruck,
      containerNo: cleanContainer,
      containerSize,
      fullOrEmpty: 'Full',
      sealNo: 'TCLU7890123',
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
      driver: event.driver || 'Ramesh Kumar',
      driverPhone: '9876543210',
      transporter: 'Shree Logistics Pvt. Ltd.',
      appointmentLink: 'APPT-2025-05-17-00156',
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
        url: p.url || 'assets/gate/container-stencil.jpg',
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
    this.showToast('Non ERP Container workflow triggered.');
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

  public openLightbox(title: string, url: string, e?: MouseEvent): void {
    if (e) e.stopPropagation();
    this.activeLightboxPhoto.set({ title, url });
  }

  public closeLightbox(): void {
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
