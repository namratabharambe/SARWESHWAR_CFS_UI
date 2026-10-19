import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  AddInventoryFormData,
  BlockUtilization,
  ContainerInventoryItem,
  ContainerYardStatus,
  InventoryFilterOptions,
  InventoryKpiMetrics,
  InventoryTypeDistribution,
  LocationUtilizationItem,
} from 'shared/types/inventory/inventory.interface';
import { GateEventService } from 'shared/services/gate-event.service';
import { AuthService } from 'core/auth/auth.service';
import { VisitListItemDto, VisitsPagedResponse, GateCountsResponse } from 'shared/types/gate-event/gate-event.interface';
import {
  isCreatedToday,
  isVisitArrival,
  isVisitDeparture,
  isVisitArrivalToday,
  isVisitDepartureToday,
  matchesDateFilter,
  parseAnyDate,
} from 'shared/utils/date-filter.util';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly gateEventService = inject(GateEventService);
  private readonly authService = inject(AuthService);

  // Active Gate Mode ('ALL' | 'GATE_IN' | 'GATE_OUT')
  public readonly activeGateMode = signal<'ALL' | 'GATE_IN' | 'GATE_OUT'>('ALL');

  // Loading state for live API fetching
  public readonly isLoading = signal<boolean>(false);

  // Total server count
  public readonly totalServerCount = signal<number>(0);

  /**
   * Dynamically calculate Days in Yard depending on the container's arrival date
   */
  public calculateDaysInYard(arrivalDateStr?: string): number {
    if (!arrivalDateStr) return 0;
    const arrival = new Date(arrivalDateStr);
    if (isNaN(arrival.getTime())) return 0;
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - arrival.getTime());
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Live database gate counts
  public readonly gateCounts = signal<GateCountsResponse | null>(null);
  public readonly gateInTotalCount = signal<number>(0);
  public readonly todayGateInCount = signal<number>(0);
  public readonly gateOutTotalCount = signal<number>(0);
  public readonly todayGateOutCount = signal<number>(0);

  public readonly fromDate = signal<string | undefined>(undefined);
  public readonly toDate = signal<string | undefined>(undefined);

  private createFallbackContainers(mode: 'GATE_IN' | 'GATE_OUT', count: number = 40): ContainerInventoryItem[] {
    const lineCodes = ['MSKU', 'CMAU', 'HMMU', 'OOLU', 'MSCU', 'COSU', 'EGLU', 'ZIMU', 'PILU', 'ONEU'];
    const customerList = [
      'Tata Motors Limited',
      'Global Shippers Corp',
      'Orient Express Freight',
      'Hyundai Merchant Marine',
      'Trans-Hub Logistics',
      'CMA CGM Agency',
      'NYK Line Logistics',
      'Hamburg Sud Logistics',
      'Reliance Industries Ltd',
      'Sun Pharma Exports',
      'Mahindra Logistics',
      'Adani Ports & SEZ',
    ];
    const blocks = ['A', 'B', 'C', 'D', 'E', 'F'];
    const sizes = ["40' HC", "20' GP", "40' HC", "45' HC", "20' GP"];

    const items: ContainerInventoryItem[] = [];
    for (let i = 1; i <= count; i++) {
      const linePrefix = lineCodes[(i - 1) % lineCodes.length];
      const serial = 100000 + i * 1973;
      const checkDigit = (i * 7) % 10;
      const containerNo = `${linePrefix} ${String(serial).slice(0, 6)} ${checkDigit}`;
      const sizeType = sizes[(i - 1) % sizes.length];
      const line = linePrefix.slice(0, 3);
      const isFull = i % 4 !== 0;
      const fullEmpty: 'Full' | 'Empty' = isFull ? 'Full' : 'Empty';
      const cargoType: 'Export' | 'Import' | 'Empty' =
        fullEmpty === 'Empty' ? 'Empty' : mode === 'GATE_OUT' ? 'Export' : 'Import';
      const block = blocks[(i - 1) % blocks.length];
      const row = String(((i * 3) % 18) + 1).padStart(2, '0');
      const bay = String(((i * 2) % 12) + 1).padStart(2, '0');
      const tier = String(((i * 5) % 4) + 1).padStart(2, '0');
      const days = (i * 3) % 14;
      const arrivalObj = new Date(Date.now() - days * 24 * 60 * 60 * 1000 - i * 1800000);
      const arrivalDate = arrivalObj.toISOString();
      const lastUpdated =
        arrivalObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' +
        arrivalObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const customer = customerList[(i - 1) % customerList.length];
      const grossWeight = fullEmpty === 'Empty' ? 2200 + (i * 50) % 800 : 18000 + (i * 450) % 14000;

      items.push({
        id: `${mode.toLowerCase()}-${i}`,
        containerNo,
        sizeType,
        line,
        fullEmpty,
        cargoType,
        currentLocation: mode === 'GATE_OUT' ? 'Gate Out' : 'In Yard',
        block,
        row,
        bay,
        tier,
        yardStatus: mode === 'GATE_OUT' ? 'Gate Out' : days > 7 ? 'Overstay' : 'In Yard',
        lastAction: mode === 'GATE_OUT' ? 'Gated Out' : 'Gated In',
        arrivalDate,
        lastUpdated,
        daysInYard: days,
        holds: '-',
        isStarred: i === 1 || i === 5,
        customerName: customer,
        bookingNo: `BKG-${line}-${20000 + i * 117}`,
        blNumber: `BL-${line}-${90000 + i * 314}`,
        cargoDescription: isFull ? 'General Commercial Cargo' : 'Empty Equipment',
        grossWeightKg: grossWeight,
        sealNo: isFull ? `SEAL-${80000 + i * 29}` : undefined,
      });
    }
    return items;
  }

  // Collection signal initialized with all items (both Gate In and Gate Out)
  public readonly containers = signal<ContainerInventoryItem[]>([]);

  // Active Selected Container for Drawer / Details
  public readonly selectedContainer = signal<ContainerInventoryItem | null>(null);

  // Modal Open States
  public readonly isAddModalOpen = signal<boolean>(false);
  public readonly isDrawerOpen = signal<boolean>(false);
  public readonly isMoveModalOpen = signal<boolean>(false);

  // Filter Signals (Kept simple, driven by Gate In / Gate Out toggle & Date)
  public readonly selectedKpiFilter = signal<string>('All');
  public readonly dateFilter = signal<string>('');
  public readonly filter = signal<InventoryFilterOptions>({
    containerNo: '',
    shippingLine: 'All',
    block: 'All',
    row: 'All',
    bay: 'All',
    tier: 'All',
    size: 'All',
    type: 'All',
    status: 'All',
    fullEmpty: 'All',
    customer: 'All',
    searchQuery: '',
    dateFilter: '',
  });

  public selectKpiCard(kpi: string): void {
    if (this.selectedKpiFilter() === kpi) {
      this.selectedKpiFilter.set('All');
    } else {
      this.selectedKpiFilter.set(kpi);
    }
    this.currentPage.set(1);
  }

  public updateFilter<K extends keyof InventoryFilterOptions>(key: K, val: InventoryFilterOptions[K]): void {
    this.filter.update((f) => ({ ...f, [key]: val }));
    this.currentPage.set(1);
  }

  public setDateFilter(date: string): void {
    this.dateFilter.set(date);
    this.currentPage.set(1);

    if (!date) {
      this.fromDate.set(undefined);
      this.toDate.set(undefined);
      this.loadLiveGateData();
      return;
    }

    const parsed = parseAnyDate(date);
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

    this.loadLiveGateData();
  }

  // Pagination Signals (Default pageSize 10 for clean 1, 2, 3, 4 page navigation)
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  // Toast Signal
  public readonly toastMessage = signal<string | null>(null);

  constructor() {
    // Automatically load live data on initialization (ALL by default)
    this.loadLiveGateData('ALL');

    // Reactively refresh when active site or client changes
    effect(() => {
      const sId = this.authService.selectedSiteId();
      const cId = this.authService.selectedClientId();
      if (sId || cId) {
        this.loadLiveGateData(this.activeGateMode());
      }
    });
  }

  /**
   * Switches active gate mode ('ALL' | 'GATE_IN' | 'GATE_OUT') and triggers live API fetch
   */
  public setGateMode(mode: 'ALL' | 'GATE_IN' | 'GATE_OUT'): void {
    if (this.activeGateMode() === mode) {
      this.activeGateMode.set('ALL');
    } else {
      this.activeGateMode.set(mode);
    }
    this.currentPage.set(1);
    this.loadLiveGateData(this.activeGateMode());
  }

  public loadVisitsData(): void {
    this.loadLiveGateData();
  }

  /**
   * Fetches live data from backend Gate API with full counts and date filters matching Gate Events module
   */
  public loadLiveGateData(mode: 'ALL' | 'GATE_IN' | 'GATE_OUT' = this.activeGateMode()): void {
    this.isLoading.set(true);
    const siteId = this.authService.getActiveSiteId() || undefined;
    const clientId = this.authService.getActiveClientId() || undefined;
    const from = this.fromDate();
    const to = this.toDate();

    // Fetch database gate counts directly from GET /gate/counts
    this.gateEventService.getGateCounts(siteId, clientId).subscribe({
      next: (counts) => {
        if (counts) {
          this.gateCounts.set(counts);
          if (typeof counts.totalGateIn === 'number') this.gateInTotalCount.set(counts.totalGateIn);
          if (typeof counts.totalGateOut === 'number') this.gateOutTotalCount.set(counts.totalGateOut);
          const todayIn = counts.todayArrivals ?? counts.todayGateIn;
          if (typeof todayIn === 'number') this.todayGateInCount.set(todayIn);
          const todayOut = counts.todayDepartures ?? counts.todayGateOut;
          if (typeof todayOut === 'number') this.todayGateOutCount.set(todayOut);
          if (typeof counts.totalCount === 'number') this.totalServerCount.set(counts.totalCount);
        }
      },
      error: () => {},
    });

    this.gateEventService
      .getVisits({
        page: 1,
        pageSize: 200,
        siteId,
        clientId,
        from,
        to,
      })
      .pipe(
        switchMap((res: VisitsPagedResponse) => {
          const firstPageItems = res?.items ?? (Array.isArray(res) ? (res as any) : []);
          const totalCount = res?.totalCount ?? firstPageItems.length;
          const returnedCount = firstPageItems.length;

          // If there are more items beyond page 1, fetch remaining pages in parallel
          if (totalCount > returnedCount && returnedCount > 0) {
            const pageSize = 200;
            const totalPages = Math.ceil(totalCount / pageSize);
            const remainingRequests$: Observable<VisitsPagedResponse>[] = [];
            for (let p = 2; p <= totalPages; p++) {
              remainingRequests$.push(
                this.gateEventService.getVisits({
                  page: p,
                  pageSize,
                  siteId,
                  clientId,
                  from,
                  to,
                }),
              );
            }
            return forkJoin(remainingRequests$).pipe(
              map((moreResponses) => {
                const allItems = [...firstPageItems];
                for (const r of moreResponses) {
                  if (r?.items?.length) {
                    allItems.push(...r.items);
                  }
                }
                return { items: allItems, totalCount: Math.max(totalCount, allItems.length) };
              }),
            );
          }

          return of({ items: firstPageItems, totalCount });
        }),
      )
      .subscribe({
        next: ({ items }) => {
          this.isLoading.set(false);
          if (items && items.length > 0) {
            const mapped = this.mapVisitsToInventoryItems(items, 'ALL');
            mapped.sort((a, b) => {
              const tA = (a.arrivalDate ? new Date(a.arrivalDate).getTime() : 0) || 0;
              const tB = (b.arrivalDate ? new Date(b.arrivalDate).getTime() : 0) || 0;
              return tB - tA;
            });
            this.containers.set(mapped);
            this.totalServerCount.set(mapped.length);

            const counts = this.gateCounts();
            const listIn = mapped.filter((c) => c.lastAction === 'Gated In' || c.currentLocation === 'In Yard').length;
            const listOut = mapped.filter((c) => c.lastAction === 'Gated Out' || c.currentLocation === 'Gate Out').length;
            const todayIn = typeof (counts?.todayArrivals ?? counts?.todayGateIn) === 'number'
              ? (counts?.todayArrivals ?? counts?.todayGateIn)!
              : items.filter((v: any) => isVisitArrivalToday(v)).length;
            const todayOut = typeof (counts?.todayDepartures ?? counts?.todayGateOut) === 'number'
              ? (counts?.todayDepartures ?? counts?.todayGateOut)!
              : items.filter((v: any) => isVisitDepartureToday(v)).length;
            const totalIn = typeof counts?.totalGateIn === 'number'
              ? counts.totalGateIn
              : (items.filter((v: any) => isVisitArrival(v)).length || listIn);
            const totalOut = typeof counts?.totalGateOut === 'number'
              ? counts.totalGateOut
              : (items.filter((v: any) => isVisitDeparture(v)).length || listOut);

            this.gateInTotalCount.set(totalIn);
            this.gateOutTotalCount.set(totalOut);
            this.todayGateInCount.set(todayIn);
            this.todayGateOutCount.set(todayOut);
            if (typeof counts?.totalCount === 'number') {
              this.totalServerCount.set(counts.totalCount);
            }

            if (mapped.length > 0) {
              this.selectedContainer.set(mapped[0]);
            }
          } else {
            this.containers.set([]);
            const counts = this.gateCounts();
            if (counts && typeof counts.totalGateIn === 'number') {
              this.gateInTotalCount.set(counts.totalGateIn);
              this.gateOutTotalCount.set(counts.totalGateOut ?? 0);
              this.todayGateInCount.set(counts.todayGateIn ?? counts.todayArrivals ?? 0);
              this.todayGateOutCount.set(counts.todayGateOut ?? counts.todayDepartures ?? 0);
              this.totalServerCount.set(counts.totalCount ?? ((counts.totalGateIn ?? 0) + (counts.totalGateOut ?? 0)));
            } else {
              this.totalServerCount.set(0);
              this.gateInTotalCount.set(0);
              this.gateOutTotalCount.set(0);
              this.todayGateInCount.set(0);
              this.todayGateOutCount.set(0);
            }
            this.selectedContainer.set(null);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.containers.set([]);
          const counts = this.gateCounts();
          if (counts && typeof counts.totalGateIn === 'number') {
            this.gateInTotalCount.set(counts.totalGateIn);
            this.gateOutTotalCount.set(counts.totalGateOut ?? 0);
            this.todayGateInCount.set(counts.todayGateIn ?? counts.todayArrivals ?? 0);
            this.todayGateOutCount.set(counts.todayGateOut ?? counts.todayDepartures ?? 0);
            this.totalServerCount.set(counts.totalCount ?? ((counts.totalGateIn ?? 0) + (counts.totalGateOut ?? 0)));
          } else {
            this.totalServerCount.set(0);
            this.gateInTotalCount.set(0);
            this.gateOutTotalCount.set(0);
            this.todayGateInCount.set(0);
            this.todayGateOutCount.set(0);
          }
          this.selectedContainer.set(null);
        },
      });
  }

  private mapVisitsToInventoryItems(visits: any[], mode: 'ALL' | 'GATE_IN' | 'GATE_OUT'): ContainerInventoryItem[] {
    const result: ContainerInventoryItem[] = [];

    visits.forEach((v, index) => {
      const eventsList = Array.isArray(v.events) ? v.events : Array.isArray(v.Events) ? v.Events : [];
      const hasIn = isVisitArrival(v);
      const hasOut = isVisitDeparture(v);

      const inEvent = eventsList.find((ev: any) => {
        const t = String(ev.eventType ?? ev.EventType ?? '').toUpperCase();
        return t.includes('IN') || t.includes('ENTER');
      });
      const outEvent = eventsList.find((ev: any) => {
        const t = String(ev.eventType ?? ev.EventType ?? '').toUpperCase();
        return t.includes('OUT') || t.includes('EXIT');
      });

      const directionsToGenerate: ('IN' | 'OUT')[] = [];
      if (mode === 'GATE_IN') {
        if (hasIn || !hasOut) directionsToGenerate.push('IN');
      } else if (mode === 'GATE_OUT') {
        if (hasOut || !hasIn) directionsToGenerate.push('OUT');
      } else {
        // mode === 'ALL'
        if (inEvent && outEvent) {
          directionsToGenerate.push('OUT');
          directionsToGenerate.push('IN');
        } else if (hasOut) {
          directionsToGenerate.push('OUT');
        } else {
          directionsToGenerate.push('IN');
        }
      }

      directionsToGenerate.forEach((dir) => {
        const primaryEvent = dir === 'OUT' ? (outEvent || eventsList[0] || null) : (inEvent || eventsList[0] || null);
        const arrivalDate =
          primaryEvent?.capturedAt ?? primaryEvent?.CapturedAt ?? (dir === 'OUT' ? (v.departedAt ?? v.DepartedAt ?? v.createdAt) : (v.arrivedAt ?? v.ArrivedAt ?? v.createdAt)) ?? new Date().toISOString();
        const daysInYard = this.calculateDaysInYard(arrivalDate);

        const dateObj = new Date(arrivalDate);
        const formattedDate = isNaN(dateObj.getTime())
          ? arrivalDate
          : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ', ' +
            dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const rawContainers = Array.isArray(v.containers) && v.containers.length > 0
          ? v.containers
          : Array.isArray(v.Containers) && v.Containers.length > 0
            ? v.Containers
            : null;

        if (rawContainers && rawContainers.length > 0) {
          rawContainers.forEach((cItem: any, cIdx: number) => {
            const cNumber =
              cItem.containerNumber ||
              cItem.ContainerNumber ||
              v.containerNumber ||
              v.ContainerNumber ||
              `CONT-${1000 + index}-${cIdx + 1}`;
            const cSize = cItem.size || cItem.Size || v.containerSize || v.ContainerSize || "40' HC";
            const rawFullEmpty = cItem.fullOrEmpty || cItem.FullOrEmpty;
            const fullEmpty = rawFullEmpty?.toLowerCase().includes('empty') ? 'Empty' : 'Full';

            let cargoType: 'Export' | 'Import' | 'Empty' = fullEmpty === 'Empty' ? 'Empty' : (dir === 'OUT' ? 'Export' : 'Import');
            const rawCt = cItem.cargoType || cItem.CargoType;
            if (rawCt) {
              const ct = rawCt.toLowerCase();
              if (ct.includes('export')) cargoType = 'Export';
              else if (ct.includes('empty')) cargoType = 'Empty';
              else if (ct.includes('import')) cargoType = 'Import';
            }

            const isOut = dir === 'OUT';

            result.push({
              id: `${v.visitId || v.VisitId || index}-${dir.toLowerCase()}-${cIdx}`,
              containerNo: String(cNumber).toUpperCase(),
              sizeType: String(cSize),
              line: String(cNumber).slice(0, 3).toUpperCase() || 'MSK',
              fullEmpty,
              cargoType,
              currentLocation: isOut ? 'Gate Out' : 'In Yard',
              block: 'A',
              row: '01',
              bay: '01',
              tier: '01',
              yardStatus: isOut ? 'Gate Out' : daysInYard > 7 ? 'Overstay' : 'In Yard',
              lastAction: isOut ? 'Gated Out' : 'Gated In',
              arrivalDate,
              lastUpdated: formattedDate,
              daysInYard,
              holds: '-',
              customerName: v.driverName || v.DriverName || 'General Shipping Logistics',
              bookingNo: `BKG-${v.visitId || v.VisitId ? String(v.visitId || v.VisitId).slice(0, 6) : 1000 + index}`,
            });
          });
        } else {
          const cNumber =
            v.containerNumber ||
            v.ContainerNumber ||
            primaryEvent?.detectedContainerNumber ||
            primaryEvent?.DetectedContainerNumber ||
            `CONT-${1000 + index}`;
          const cSize =
            v.containerSize ||
            v.ContainerSize ||
            primaryEvent?.detectedContainerSize ||
            primaryEvent?.DetectedContainerSize ||
            "40' HC";

          const isOut = dir === 'OUT';
          const fullEmpty = 'Full';
          const cargoType: 'Export' | 'Import' | 'Empty' = isOut ? 'Export' : 'Import';

          result.push({
            id: `${v.visitId || v.VisitId || `live-${index}`}-${dir.toLowerCase()}`,
            containerNo: String(cNumber).toUpperCase(),
            sizeType: String(cSize),
            line: String(cNumber).slice(0, 3).toUpperCase() || 'MSK',
            fullEmpty,
            cargoType,
            currentLocation: isOut ? 'Gate Out' : 'In Yard',
            block: 'A',
            row: '01',
            bay: '01',
            tier: '01',
            yardStatus: isOut ? 'Gate Out' : daysInYard > 7 ? 'Overstay' : 'In Yard',
            lastAction: isOut ? 'Gated Out' : 'Gated In',
            arrivalDate,
            lastUpdated: formattedDate,
            daysInYard,
            holds: '-',
            customerName: v.driverName || v.DriverName || 'General Shipping Logistics',
            bookingNo: `BKG-${v.visitId || v.VisitId ? String(v.visitId || v.VisitId).slice(0, 6) : 1000 + index}`,
          });
        }
      });
    });

    return result;
  }

  private mapLegacyToInventoryItems(items: any[], mode: 'GATE_IN' | 'GATE_OUT'): ContainerInventoryItem[] {
    return items.map((item, index) => {
      const arrivalDate = item.capturedAt || item.CapturedAt || item.createdAt || new Date().toISOString();
      const daysInYard = this.calculateDaysInYard(arrivalDate);
      const cNumber =
        item.container?.containerNumber ||
        item.Container?.ContainerNumber ||
        item.detectedContainerNumber ||
        `CONT-${2000 + index}`;
      const cSize =
        item.container?.size || item.Container?.Size || item.detectedContainerSize || "40' HC";

      return {
        id: item.id || item.Id || `legacy-${index}`,
        containerNo: String(cNumber).toUpperCase(),
        sizeType: String(cSize),
        line: String(cNumber).slice(0, 3).toUpperCase() || 'MSK',
        fullEmpty: 'Full',
        cargoType: mode === 'GATE_OUT' ? 'Export' : 'Import',
        currentLocation: mode === 'GATE_OUT' ? 'Gate Out' : 'In Yard',
        block: 'B',
        row: '02',
        bay: '03',
        tier: '01',
        yardStatus: mode === 'GATE_OUT' ? 'Gate Out' : daysInYard > 7 ? 'Overstay' : 'In Yard',
        lastAction: mode === 'GATE_OUT' ? 'Gated Out' : 'Gated In',
        arrivalDate,
        lastUpdated: 'Recently',
        daysInYard,
        holds: '-',
        customerName: 'Gateway Logistics India',
      };
    });
  }

  // Filtered list across ALL records and pages
  public readonly filteredContainers = computed<ContainerInventoryItem[]>(() => {
    let list = this.containers();
    const mode = this.activeGateMode();

    if (mode === 'GATE_IN') {
      list = list.filter((c) => c.lastAction === 'Gated In' || c.currentLocation !== 'Gate Out');
    } else if (mode === 'GATE_OUT') {
      list = list.filter((c) => c.lastAction === 'Gated Out' || c.currentLocation === 'Gate Out');
    }

    // KPI Card Filter
    const kpi = this.selectedKpiFilter().trim();
    if (kpi === 'Total Gate In') {
      list = list.filter((c) => c.lastAction === 'Gated In' || c.currentLocation !== 'Gate Out');
    } else if (kpi === 'Total Gate Out') {
      list = list.filter((c) => c.lastAction === 'Gated Out' || c.currentLocation === 'Gate Out');
    } else if (kpi === 'Import') {
      list = list.filter((c) => c.cargoType === 'Import');
    } else if (kpi === 'Export') {
      list = list.filter((c) => c.cargoType === 'Export');
    } else if (kpi === 'Empty') {
      list = list.filter((c) => c.cargoType === 'Empty' || c.fullEmpty === 'Empty');
    } else if (kpi === 'Overstay' || kpi === 'Overstay (>7 Days)') {
      list = list.filter((c) => c.daysInYard > 7);
    }

    if (this.filter().shippingLine && this.filter().shippingLine !== 'All') {
      list = list.filter((c) => c.line === this.filter().shippingLine);
    }

    const q = this.filter().searchQuery?.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (c) =>
          c.containerNo.toLowerCase().includes(q) ||
          c.line.toLowerCase().includes(q) ||
          c.sizeType.toLowerCase().includes(q) ||
          c.fullEmpty.toLowerCase().includes(q) ||
          c.cargoType?.toLowerCase().includes(q) ||
          c.currentLocation.toLowerCase().includes(q) ||
          c.yardStatus.toLowerCase().includes(q) ||
          c.lastAction.toLowerCase().includes(q) ||
          c.lastUpdated.toLowerCase().includes(q) ||
          (c.arrivalDate && c.arrivalDate.toLowerCase().includes(q)) ||
          c.bookingNo?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.cargoDescription?.toLowerCase().includes(q) ||
          c.blNumber?.toLowerCase().includes(q) ||
          c.sealNo?.toLowerCase().includes(q) ||
          c.block?.toLowerCase().includes(q) ||
          c.row?.toLowerCase().includes(q) ||
          c.bay?.toLowerCase().includes(q) ||
          c.tier?.toLowerCase().includes(q),
      );
    }

    const dStr = this.dateFilter()?.trim();
    if (dStr) {
      list = list.filter((c) => {
        return (
          matchesDateFilter(c.arrivalDate, dStr) ||
          matchesDateFilter(c.lastUpdated, dStr)
        );
      });
    }

    return list;
  });

  // KPI Metrics (Calculated from actual live inventory records and database gate counts)
  public readonly kpiMetrics = computed<InventoryKpiMetrics>(() => {
    const list = this.containers();
    const mode = this.activeGateMode();
    const counts = this.gateCounts();

    const inFromList = list.filter((c) => c.lastAction === 'Gated In' || c.currentLocation === 'In Yard').length;
    const outFromList = list.filter((c) => c.lastAction === 'Gated Out' || c.currentLocation === 'Gate Out').length;
    const gateIn = typeof counts?.totalGateIn === 'number' ? counts.totalGateIn : (this.gateInTotalCount() > 0 ? this.gateInTotalCount() : inFromList);
    const gateOut = typeof counts?.totalGateOut === 'number' ? counts.totalGateOut : (this.gateOutTotalCount() > 0 ? this.gateOutTotalCount() : outFromList);

    const totalFromApi = typeof counts?.totalCount === 'number' ? counts.totalCount : this.totalServerCount();
    const total = mode === 'GATE_IN' ? gateIn : (mode === 'GATE_OUT' ? gateOut : (totalFromApi || (gateIn + gateOut) || list.length));

    const imports = list.filter((c) => c.cargoType === 'Import').length;
    const exports = list.filter((c) => c.cargoType === 'Export').length;
    const empties = list.filter((c) => c.cargoType === 'Empty' || c.fullEmpty === 'Empty').length;
    const overstays = list.filter((c) => c.daysInYard > 7).length;

    const todayIn = typeof (counts?.todayGateIn ?? counts?.todayArrivals) === 'number'
      ? (counts?.todayGateIn ?? counts?.todayArrivals)!
      : this.todayGateInCount();
    const todayOut = typeof (counts?.todayGateOut ?? counts?.todayDepartures) === 'number'
      ? (counts?.todayGateOut ?? counts?.todayDepartures)!
      : this.todayGateOutCount();

    return {
      totalContainers: total,
      totalTrend: `${total} active`,
      gateInCount: gateIn,
      gateInTrend: `${todayIn} arrivals today`,
      gateOutCount: gateOut,
      gateOutTrend: `${todayOut} departures today`,
      importCount: imports,
      importTrend: `${imports} import units`,
      exportCount: exports,
      exportTrend: `${exports} export units`,
      emptyCount: empties,
      emptyTrend: `${empties} empty units`,
      overstayCount: overstays,
      overstayTrend: `${overstays} >7 days`,
    };
  });

  // Type Distribution: Export, Import, Empty (Real live proportions)
  public readonly typeDistributions = computed<InventoryTypeDistribution[]>(() => {
    const list = this.containers();
    const exp = list.filter((c) => c.cargoType === 'Export').length;
    const imp = list.filter((c) => c.cargoType === 'Import').length;
    const emp = list.filter((c) => c.cargoType === 'Empty' || c.fullEmpty === 'Empty').length;

    const sum = exp + imp + emp || list.length || 1;
    const expPct = +((exp / sum) * 100).toFixed(1);
    const impPct = +((imp / sum) * 100).toFixed(1);
    const empPct = +Math.max(0, 100 - expPct - impPct).toFixed(1);

    return [
      { type: 'Export', count: exp, percent: expPct, color: '#2563eb' },
      { type: 'Import', count: imp, percent: impPct, color: '#10b981' },
      { type: 'Empty', count: emp, percent: empPct, color: '#8b5cf6' },
    ];
  });

  // Location Utilization: Yard and Gate (Calculated from actual container count)
  public readonly locationUtilizations = computed<LocationUtilizationItem[]>(() => {
    const totalInYard = this.containers().length;
    const yardCapacity = Math.max(100, totalInYard * 2);
    const yardPercent = Math.min(100, Math.round((totalInYard / yardCapacity) * 100));

    const gateOccupied = totalInYard;
    const gateCapacity = Math.max(50, totalInYard * 2);
    const gatePercent = Math.min(100, Math.round((gateOccupied / gateCapacity) * 100));

    return [
      {
        location: 'Yard',
        percent: yardPercent,
        occupied: totalInYard,
        capacity: yardCapacity,
        color: '#525EA7',
        icon: 'warehouse',
      },
      {
        location: 'Gate',
        percent: gatePercent,
        occupied: gateOccupied,
        capacity: gateCapacity,
        color: '#10b981',
        icon: 'sensor_door',
      },
    ];
  });

  // Paginated containers
  public readonly paginatedContainers = computed<ContainerInventoryItem[]>(() => {
    const list = this.filteredContainers();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  // Total pages
  public readonly totalPages = computed<number>(() => {
    const total = this.filteredContainers().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  // 1-based start item index on current page
  public readonly pageStart = computed<number>(() => {
    const total = this.filteredContainers().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  // 1-based end item index on current page
  public readonly pageEnd = computed<number>(() => {
    const total = this.filteredContainers().length;
    return Math.min(this.currentPage() * this.pageSize(), total);
  });

  // Actions
  public selectContainer(c: ContainerInventoryItem): void {
    this.selectedContainer.set(c);
    this.isDrawerOpen.set(true);
  }

  public openDrawer(c: ContainerInventoryItem): void {
    this.selectedContainer.set(c);
    this.isDrawerOpen.set(true);
  }

  public closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  public openMoveModal(c: ContainerInventoryItem): void {
    this.selectedContainer.set(c);
    this.isMoveModalOpen.set(true);
  }

  public closeMoveModal(): void {
    this.isMoveModalOpen.set(false);
  }

  public toggleStar(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.containers.update((items) => items.map((c) => (c.id === id ? { ...c, isStarred: !c.isStarred } : c)));
  }

  public setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  public setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  public setSearchQuery(q: string): void {
    this.filter.update((f) => ({ ...f, searchQuery: q }));
    this.currentPage.set(1);
  }

  public addInventory(formData: AddInventoryFormData): ContainerInventoryItem {
    const now = new Date();
    const arrivalDate = now.toISOString();
    const formatted = `${now.getDate()} May 2025 ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newItem: ContainerInventoryItem = {
      id: `inv-${Date.now()}`,
      containerNo: formData.containerNo.toUpperCase(),
      sizeType: formData.sizeType,
      line: formData.line,
      fullEmpty: formData.fullEmpty,
      cargoType: formData.fullEmpty === 'Empty' ? 'Empty' : 'Import',
      currentLocation: 'In Yard', // Location shows "In Yard"
      block: formData.block,
      row: formData.row,
      bay: formData.bay,
      tier: formData.tier,
      yardStatus: formData.yardStatus,
      lastAction: 'Gated In',
      arrivalDate,
      lastUpdated: formatted,
      daysInYard: 0, // dynamically 0 for brand new arrival
      holds: formData.holds || '-',
      customerName: formData.customerName || 'General Shipping Client',
      bookingNo: formData.bookingNo || `BKG-${Date.now().toString().slice(-6)}`,
      grossWeightKg: formData.grossWeightKg || 24000,
      sealNo: formData.sealNo || `SEAL-${Date.now().toString().slice(-4)}`,
    };

    this.containers.update((list) => [newItem, ...list]);
    this.selectedContainer.set(newItem);
    this.showToast(`Container ${newItem.containerNo} added to yard inventory.`);
    return newItem;
  }

  public moveContainer(id: string, newLocation: { block: string; row: string; bay: string; tier: string }): void {
    const locString = 'In Yard';
    const now = new Date();
    const formatted = `${now.getDate()} May 2025 ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    this.containers.update((items) =>
      items.map((c) =>
        c.id === id
          ? {
              ...c,
              currentLocation: locString,
              block: newLocation.block,
              row: newLocation.row,
              bay: newLocation.bay,
              tier: newLocation.tier,
              lastAction: `Moved within Yard (${newLocation.block}/${newLocation.row})`,
              lastUpdated: formatted,
            }
          : c,
      ),
    );

    const sel = this.selectedContainer();
    if (sel && sel.id === id) {
      this.selectedContainer.set({
        ...sel,
        currentLocation: locString,
        block: newLocation.block,
        row: newLocation.row,
        bay: newLocation.bay,
        tier: newLocation.tier,
        lastAction: `Moved within Yard (${newLocation.block}/${newLocation.row})`,
        lastUpdated: formatted,
      });
    }

    this.showToast(`Relocated container to ${locString}`);
    this.closeMoveModal();
  }

  public toggleHold(id: string, holdType: string): void {
    this.containers.update((items) =>
      items.map((c) => {
        if (c.id === id) {
          const isCurrentlyHeld = c.yardStatus === 'Hold';
          return {
            ...c,
            yardStatus: isCurrentlyHeld ? 'In Yard' : 'Hold',
            holds: isCurrentlyHeld ? '-' : holdType || 'Customs Hold',
            lastAction: isCurrentlyHeld ? 'Hold Removed' : 'Hold Placed',
            lastUpdated: 'Just now',
          };
        }
        return c;
      }),
    );
    this.showToast(`Hold status toggled for container.`);
  }

  public exportDataToCsv(selectedIds?: Set<string>): void {
    const isSelective = !!selectedIds && selectedIds.size > 0;
    const rows = isSelective
      ? this.containers().filter((c) => selectedIds.has(c.id))
      : this.filteredContainers();

    if (!rows.length) {
      this.showToast('No records available to export.');
      return;
    }

    const headers = [
      'Container No',
      'Size/Type',
      'Full/Empty',
      'Location',
      'Last Action',
      'Arrival Date / Last Updated',
      'Days in Yard',
      'Customer',
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((c) =>
          [
            c.containerNo,
            c.sizeType,
            c.fullEmpty,
            c.currentLocation,
            c.lastAction,
            c.lastUpdated,
            c.daysInYard,
            c.customerName || '',
          ]
            .map((v) => `"${v}"`)
            .join(','),
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = isSelective
      ? `container-inventory-selected-${rows.length}-${new Date().toISOString().slice(0, 10)}.csv`
      : `container-inventory-${this.activeGateMode().toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (isSelective) {
      this.showToast(`Exported ${rows.length} selected record${rows.length > 1 ? 's' : ''} to CSV.`);
    } else {
      this.showToast('Exported inventory to CSV.');
    }
  }

  public showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }
}