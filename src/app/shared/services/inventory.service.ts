import { Injectable, computed, signal } from '@angular/core';
import {
  AddInventoryFormData,
  BlockUtilization,
  ContainerInventoryItem,
  ContainerYardStatus,
  InventoryFilterOptions,
  InventoryKpiMetrics,
  InventoryTypeDistribution,
} from 'shared/types/inventory/inventory.interface';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly initialContainers: ContainerInventoryItem[] = [
    {
      id: 'inv-1',
      containerNo: 'MSCU 556123 4',
      sizeType: "40' HC",
      line: 'MSK',
      fullEmpty: 'Full',
      currentLocation: 'A / 12 / 05 / 02',
      block: 'A',
      row: '12',
      bay: '05',
      tier: '02',
      yardStatus: 'In Yard',
      lastAction: 'Gated In',
      lastUpdated: '23 May 2025 10:24 AM',
      daysInYard: 3,
      holds: '-',
      isStarred: true,
      customerName: 'Tata Motors Limited',
      bookingNo: 'BKGS2051709',
      blNumber: 'BL-MSC-990142',
      cargoDescription: 'Automotive Engine Parts',
      grossWeightKg: 28450,
      sealNo: 'ML-IN-982341',
    },
    {
      id: 'inv-2',
      containerNo: 'TCNU 789654 1',
      sizeType: "20' GP",
      line: 'TCLU',
      fullEmpty: 'Empty',
      currentLocation: 'B / 07 / 03 / 01',
      block: 'B',
      row: '07',
      bay: '03',
      tier: '01',
      yardStatus: 'In Yard',
      lastAction: 'Moved to B / 07 / 03 / 01',
      lastUpdated: '23 May 2025 09:58 AM',
      daysInYard: 1,
      holds: '-',
      customerName: 'Global Shippers Corp',
      bookingNo: 'BKG-TCL-8812',
      grossWeightKg: 2200,
    },
    {
      id: 'inv-3',
      containerNo: 'OOLU 123456 7',
      sizeType: "40' HC",
      line: 'OOCL',
      fullEmpty: 'Full',
      currentLocation: 'C / 03 / 08 / 03',
      block: 'C',
      row: '03',
      bay: '08',
      tier: '03',
      yardStatus: 'In Yard',
      lastAction: 'Gated In',
      lastUpdated: '22 May 2025 04:21 PM',
      daysInYard: 2,
      holds: '-',
      customerName: 'Orient Express Freight',
      bookingNo: 'OOL-449102',
      grossWeightKg: 24100,
    },
    {
      id: 'inv-4',
      containerNo: 'HMMU 123456 7',
      sizeType: "40' HC",
      line: 'HMM',
      fullEmpty: 'Full',
      currentLocation: 'A / 15 / 02 / 04',
      block: 'A',
      row: '15',
      bay: '02',
      tier: '04',
      yardStatus: 'Overstay',
      lastAction: 'Arrived',
      lastUpdated: '20 May 2025 11:12 AM',
      daysInYard: 8,
      holds: '-',
      customerName: 'Hyundai Merchant Marine',
      bookingNo: 'EXP-889021',
      grossWeightKg: 32450,
      isHazardous: false,
    },
    {
      id: 'inv-5',
      containerNo: 'TRHU 987654 3',
      sizeType: "20' GP",
      line: 'TRHU',
      fullEmpty: 'Empty',
      currentLocation: 'D / 01 / 09 / 01',
      block: 'D',
      row: '01',
      bay: '09',
      tier: '01',
      yardStatus: 'In Yard',
      lastAction: 'Gated In',
      lastUpdated: '23 May 2025 08:45 AM',
      daysInYard: 0,
      holds: '-',
      customerName: 'Trans-Hub Logistics',
      bookingNo: 'TRH-001294',
      grossWeightKg: 2150,
    },
    {
      id: 'inv-6',
      containerNo: 'TEMU 456789 2',
      sizeType: "40' HC",
      line: 'COSC',
      fullEmpty: 'Full',
      currentLocation: 'E / 02 / 04 / 02',
      block: 'E',
      row: '02',
      bay: '04',
      tier: '02',
      yardStatus: 'Hold',
      lastAction: 'Hold Placed',
      lastUpdated: '22 May 2025 02:33 PM',
      daysInYard: 4,
      holds: 'DG',
      hasWarning: true,
      warningText: 'Dangerous Goods Class 3 Flammable Hold',
      isHazardous: true,
      customerName: 'Falcon Chemicals India',
      bookingNo: 'RF-991048',
      grossWeightKg: 25600,
    },
    {
      id: 'inv-7',
      containerNo: 'CMAU 456789 2',
      sizeType: "20' GP",
      line: 'CMA',
      fullEmpty: 'Empty',
      currentLocation: 'B / 05 / 06 / 03',
      block: 'B',
      row: '05',
      bay: '06',
      tier: '03',
      yardStatus: 'In Yard',
      lastAction: 'Moved to B / 05 / 06 / 03',
      lastUpdated: '23 May 2025 10:02 AM',
      daysInYard: 1,
      holds: '-',
      customerName: 'CMA CGM Agency',
      bookingNo: 'YRD-104922',
      grossWeightKg: 2300,
    },
    {
      id: 'inv-8',
      containerNo: 'MSKU 234567 8',
      sizeType: "40' HC",
      line: 'MSK',
      fullEmpty: 'Full',
      currentLocation: 'A / 10 / 01 / 01',
      block: 'A',
      row: '10',
      bay: '01',
      tier: '01',
      yardStatus: 'Ready Out',
      lastAction: 'Gate Out',
      lastUpdated: '21 May 2025 05:11 PM',
      daysInYard: 0,
      holds: '-',
      customerName: 'Sun Pharma Exports',
      bookingNo: 'EXP-332910',
      grossWeightKg: 26500,
    },
    {
      id: 'inv-9',
      containerNo: 'NYKU 876543 9',
      sizeType: "40' HC",
      line: 'NYK',
      fullEmpty: 'Empty',
      currentLocation: 'F / 04 / 03 / 02',
      block: 'F',
      row: '04',
      bay: '03',
      tier: '02',
      yardStatus: 'In Yard',
      lastAction: 'Gated In',
      lastUpdated: '23 May 2025 07:36 AM',
      daysInYard: 0,
      holds: '-',
      customerName: 'NYK Line Logistics',
      bookingNo: 'NYK-992104',
      grossWeightKg: 3800,
    },
    {
      id: 'inv-10',
      containerNo: 'SUDU 765432 1',
      sizeType: "20' GP",
      line: 'SUD',
      fullEmpty: 'Full',
      currentLocation: 'C / 08 / 02 / 01',
      block: 'C',
      row: '08',
      bay: '02',
      tier: '01',
      yardStatus: 'In Yard',
      lastAction: 'Arrived',
      lastUpdated: '22 May 2025 01:20 PM',
      daysInYard: 2,
      holds: '-',
      customerName: 'Hamburg Sud Logistics',
      bookingNo: 'SUD-551029',
      grossWeightKg: 18500,
    },
    {
      id: 'inv-11',
      containerNo: 'PONU 234567 8',
      sizeType: "40' HC",
      line: 'PIL',
      fullEmpty: 'Empty',
      currentLocation: 'D / 03 / 07 / 02',
      block: 'D',
      row: '03',
      bay: '07',
      tier: '02',
      yardStatus: 'In Yard',
      lastAction: 'Moved to D / 03 / 07 / 02',
      lastUpdated: '23 May 2025 09:21 AM',
      daysInYard: 1,
      holds: '-',
      customerName: 'Pacific International Lines',
      bookingNo: 'PIL-330192',
      grossWeightKg: 3900,
    },
    {
      id: 'inv-12',
      containerNo: 'BEAU 123456 9',
      sizeType: "20' GP",
      line: 'BEA',
      fullEmpty: 'Full',
      currentLocation: 'A / 09 / 06 / 01',
      block: 'A',
      row: '09',
      bay: '06',
      tier: '01',
      yardStatus: 'Overstay',
      lastAction: 'Hold Removed',
      lastUpdated: '19 May 2025 03:40 PM',
      daysInYard: 10,
      holds: '-',
      customerName: 'Beacon Intermodal',
      bookingNo: 'BEA-102948',
      grossWeightKg: 16800,
    },
    {
      id: 'inv-13',
      containerNo: 'ZIMU 987654 0',
      sizeType: "40' HC",
      line: 'ZIM',
      fullEmpty: 'Full',
      currentLocation: 'E / 01 / 05 / 03',
      block: 'E',
      row: '01',
      bay: '05',
      tier: '03',
      yardStatus: 'In Yard',
      lastAction: 'Gated In',
      lastUpdated: '23 May 2025 06:52 AM',
      daysInYard: 0,
      holds: '-',
      customerName: 'ZIM Integrated Shipping',
      bookingNo: 'ZIM-884019',
      grossWeightKg: 27100,
    },
    {
      id: 'inv-14',
      containerNo: 'TGHU 555666 7',
      sizeType: "20' GP",
      line: 'TGHU',
      fullEmpty: 'Empty',
      currentLocation: 'B / 11 / 04 / 02',
      block: 'B',
      row: '11',
      bay: '04',
      tier: '02',
      yardStatus: 'In Yard',
      lastAction: 'Moved to B / 11 / 04 / 02',
      lastUpdated: '23 May 2025 10:01 AM',
      daysInYard: 1,
      holds: '-',
      customerName: 'Textainer Group',
      bookingNo: 'TGH-551029',
      grossWeightKg: 2250,
    },
    {
      id: 'inv-15',
      containerNo: 'UETU 112233 4',
      sizeType: "40' HC",
      line: 'UES',
      fullEmpty: 'Full',
      currentLocation: 'F / 06 / 01 / 01',
      block: 'F',
      row: '06',
      bay: '01',
      tier: '01',
      yardStatus: 'Ready Out',
      lastAction: 'Gate Out',
      lastUpdated: '21 May 2025 09:15 AM',
      daysInYard: 0,
      holds: '-',
      customerName: 'Universal Express Systems',
      bookingNo: 'UES-776201',
      grossWeightKg: 24800,
    },
  ];

  // Collection signal
  public readonly containers = signal<ContainerInventoryItem[]>(this.initialContainers);

  // Active Selected Container for Drawer / Details
  public readonly selectedContainer = signal<ContainerInventoryItem | null>(this.initialContainers[0]);

  // Modal Open States
  public readonly isAddModalOpen = signal<boolean>(false);
  public readonly isDrawerOpen = signal<boolean>(false);
  public readonly isMoveModalOpen = signal<boolean>(false);
  public readonly isAdvancedFilterOpen = signal<boolean>(false);

  // Filter Signals
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
  });

  // Pagination Signals
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(15);

  // Toast Signal
  public readonly toastMessage = signal<string | null>(null);

  // Filtered list
  public readonly filteredContainers = computed<ContainerInventoryItem[]>(() => {
    let list = this.containers();
    const f = this.filter();
    const q = f.searchQuery.trim().toLowerCase();

    if (f.containerNo.trim()) {
      list = list.filter((c) => c.containerNo.toLowerCase().includes(f.containerNo.trim().toLowerCase()));
    }

    if (f.shippingLine !== 'All') {
      list = list.filter((c) => c.line.toLowerCase() === f.shippingLine.toLowerCase());
    }

    if (f.block !== 'All') {
      list = list.filter((c) => c.block.toLowerCase() === f.block.toLowerCase());
    }

    if (f.row !== 'All') {
      list = list.filter((c) => c.row === f.row);
    }

    if (f.bay !== 'All') {
      list = list.filter((c) => c.bay === f.bay);
    }

    if (f.tier !== 'All') {
      list = list.filter((c) => c.tier === f.tier);
    }

    if (f.size !== 'All') {
      list = list.filter((c) => c.sizeType.includes(f.size));
    }

    if (f.type !== 'All') {
      list = list.filter((c) => c.sizeType.toLowerCase().includes(f.type.toLowerCase()));
    }

    if (f.status !== 'All') {
      list = list.filter((c) => c.yardStatus.toLowerCase() === f.status.toLowerCase());
    }

    if (f.fullEmpty !== 'All') {
      list = list.filter((c) => c.fullEmpty.toLowerCase() === f.fullEmpty.toLowerCase());
    }

    if (f.customer !== 'All') {
      list = list.filter((c) => c.customerName?.toLowerCase().includes(f.customer.toLowerCase()));
    }

    if (q) {
      list = list.filter(
        (c) =>
          c.containerNo.toLowerCase().includes(q) ||
          c.line.toLowerCase().includes(q) ||
          c.currentLocation.toLowerCase().includes(q) ||
          c.bookingNo?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.cargoDescription?.toLowerCase().includes(q),
      );
    }

    return list;
  });

  // KPI Metrics (Fixed baseline from screenshot + live delta)
  public readonly kpiMetrics = computed<InventoryKpiMetrics>(() => {
    const delta = this.containers().length - this.initialContainers.length;
    return {
      totalContainers: 2456 + delta,
      totalTrend: '6% vs yesterday',
      importCount: 1042 + Math.floor(delta * 0.4),
      importTrend: '8% vs yesterday',
      exportCount: 892 + Math.floor(delta * 0.35),
      exportTrend: '5% vs yesterday',
      emptyCount: 522 + Math.floor(delta * 0.25),
      emptyTrend: '4% vs yesterday',
      hazardousCount: 60,
      hazardousTrend: '11% vs yesterday',
      overstayCount: 214,
      overstayTrend: '19% vs yesterday',
    };
  });

  // Type Distribution for Donut Chart
  public readonly typeDistributions: InventoryTypeDistribution[] = [
    { type: "40' HC", count: 1248, percent: 50.8, color: '#2563eb' },
    { type: "20' GP", count: 862, percent: 35.1, color: '#10b981' },
    { type: "40' GP", count: 142, percent: 5.8, color: '#06b6d4' },
    { type: 'Reefer', count: 96, percent: 3.9, color: '#f59e0b' },
    { type: 'OT / FR', count: 60, percent: 2.4, color: '#f43f5e' },
    { type: 'Other', count: 48, percent: 2.0, color: '#8b5cf6' },
  ];

  // Block Utilizations for Right Widget
  public readonly blockUtilizations: BlockUtilization[] = [
    { block: 'A', percent: 68, occupied: 326, capacity: 480 },
    { block: 'B', percent: 55, occupied: 264, capacity: 480 },
    { block: 'C', percent: 48, occupied: 230, capacity: 480 },
    { block: 'D', percent: 45, occupied: 216, capacity: 480 },
    { block: 'E', percent: 50, occupied: 240, capacity: 480 },
    { block: 'F', percent: 44, occupied: 204, capacity: 480 },
  ];

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
    return 164; // Matching design screenshot total 164 pages
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

  public updateFilter<K extends keyof InventoryFilterOptions>(key: K, value: InventoryFilterOptions[K]): void {
    this.filter.update((f) => ({ ...f, [key]: value }));
    this.currentPage.set(1);
  }

  public resetFilters(): void {
    this.filter.set({
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
    });
    this.showToast('Inventory filters reset.');
  }

  public addInventory(formData: AddInventoryFormData): ContainerInventoryItem {
    const loc = `${formData.block} / ${formData.row} / ${formData.bay} / ${formData.tier}`;
    const now = new Date();
    const formatted = `${now.getDate()} May 2025 ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newItem: ContainerInventoryItem = {
      id: `inv-${Date.now()}`,
      containerNo: formData.containerNo.toUpperCase(),
      sizeType: formData.sizeType,
      line: formData.line,
      fullEmpty: formData.fullEmpty,
      currentLocation: loc,
      block: formData.block,
      row: formData.row,
      bay: formData.bay,
      tier: formData.tier,
      yardStatus: formData.yardStatus,
      lastAction: 'Gated In',
      lastUpdated: formatted,
      daysInYard: 0,
      holds: formData.holds || '-',
      customerName: formData.customerName || 'General Shipping Client',
      bookingNo: formData.bookingNo || `BKG-${Date.now().toString().slice(-6)}`,
      grossWeightKg: formData.grossWeightKg || 24000,
      sealNo: formData.sealNo || `SEAL-${Date.now().toString().slice(-4)}`,
      isHazardous: formData.isHazardous || false,
    };

    this.containers.update((list) => [newItem, ...list]);
    this.selectedContainer.set(newItem);
    this.showToast(`Container ${newItem.containerNo} added to yard inventory.`);
    return newItem;
  }

  public moveContainer(id: string, newLocation: { block: string; row: string; bay: string; tier: string }): void {
    const locString = `${newLocation.block} / ${newLocation.row} / ${newLocation.bay} / ${newLocation.tier}`;
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
              lastAction: `Moved to ${locString}`,
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
        lastAction: `Moved to ${locString}`,
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

  public exportDataToCsv(): void {
    const rows = this.filteredContainers();
    const headers = [
      'Container No',
      'Size/Type',
      'Line',
      'Full/Empty',
      'Location',
      'Status',
      'Last Action',
      'Last Updated',
      'Days in Yard',
      'Holds',
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
            c.line,
            c.fullEmpty,
            c.currentLocation,
            c.yardStatus,
            c.lastAction,
            c.lastUpdated,
            c.daysInYard,
            c.holds,
            c.customerName || '',
          ]
            .map((v) => `"${v}"`)
            .join(','),
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `container-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Exported inventory to CSV.');
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
