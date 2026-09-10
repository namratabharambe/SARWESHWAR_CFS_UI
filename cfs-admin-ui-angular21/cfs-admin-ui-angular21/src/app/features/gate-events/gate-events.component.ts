import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from 'shared/pipes';
import { GatePhotoStripComponent, GateCameraPhoto, ConfidenceBadgeComponent } from 'shared/components';

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
}

const INITIAL_GATE_EVENTS: GateEventItem[] = [
  {
    id: 'evt-01',
    eventTime: '17 May 2025, 09:24 AM',
    timestamp: 1747473840000,
    gate: 'GATE-01',
    direction: 'IN',
    truckNo: 'MH12 AB 1234',
    containerNo: 'MSCU 556123 4',
    ocrResult: 'MSCU 556123 4',
    confidence: 98,
    driver: 'Ramesh Kumar',
    status: 'Verified',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#c9842a', tag: 'MSC' },
      { label: 'Left Side ISO', color: '#c9842a', tag: 'MSC' },
      { label: 'Right Side ISO', color: '#c9842a', tag: 'MSC' },
      { label: 'Rear Doors', color: '#c9842a', tag: 'MSC' },
    ],
    notes: 'Clean entry scan, seal intact.',
  },
  {
    id: 'evt-02',
    eventTime: '17 May 2025, 09:18 AM',
    timestamp: 1747473480000,
    gate: 'GATE-02',
    direction: 'OUT',
    truckNo: 'GJ 05 XX 5678',
    containerNo: 'HMMU 123456 7',
    ocrResult: 'HMMU 123456 7',
    confidence: 96,
    driver: 'Suresh Patel',
    status: 'Verified',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#993030', tag: 'HMM' },
      { label: 'Left Side ISO', color: '#993030', tag: 'HMM' },
      { label: 'Right Side ISO', color: '#993030', tag: 'HMM' },
      { label: 'Rear Doors', color: '#993030', tag: 'HMM' },
    ],
    notes: 'Outbound gate release approved.',
  },
  {
    id: 'evt-03',
    eventTime: '17 May 2025, 09:11 AM',
    timestamp: 1747473060000,
    gate: 'GATE-01',
    direction: 'IN',
    truckNo: 'TN 09 CD 4321',
    containerNo: 'TCLU 789012 3',
    ocrResult: 'TCLU 789012 3',
    confidence: 94,
    driver: 'Arun Singh',
    status: 'Review',
    damageFlag: true,
    photos: [
      { label: 'Front OCR', color: '#883a23', tag: 'TCL' },
      { label: 'Left Side ISO', color: '#883a23', tag: 'TCL' },
      { label: 'Right Side ISO', color: '#883a23', tag: 'TCL' },
      { label: 'Rear Doors', color: '#883a23', tag: 'TCL' },
    ],
    notes: 'Dent detected on top right corner casting.',
  },
  {
    id: 'evt-04',
    eventTime: '17 May 2025, 09:05 AM',
    timestamp: 1747472700000,
    gate: 'GATE-03',
    direction: 'OUT',
    truckNo: 'KA 03 MN 9876',
    containerNo: 'CAIU 456789 2',
    ocrResult: 'CAIU 456789 2',
    confidence: 97,
    driver: 'Imran Khan',
    status: 'Verified',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#1f487e', tag: 'CAI' },
      { label: 'Left Side ISO', color: '#1f487e', tag: 'CAI' },
      { label: 'Right Side ISO', color: '#1f487e', tag: 'CAI' },
      { label: 'Rear Doors', color: '#1f487e', tag: 'CAI' },
    ],
    notes: 'Driver documents signed.',
  },
  {
    id: 'evt-05',
    eventTime: '17 May 2025, 08:59 AM',
    timestamp: 1747472340000,
    gate: 'GATE-02',
    direction: 'IN',
    truckNo: 'MH 46 PQ 2468',
    containerNo: 'MSKU 234567 8',
    ocrResult: 'MSKU 234567 8',
    confidence: 85,
    driver: 'Vikas Yadav',
    status: 'Review',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#8b8f97', tag: 'MSK' },
      { label: 'Left Side ISO', color: '#8b8f97', tag: 'MSK' },
      { label: 'Right Side ISO', color: '#8b8f97', tag: 'MSK' },
      { label: 'Rear Doors', color: '#8b8f97', tag: 'MSK' },
    ],
    notes: 'Low OCR lighting on rear door stencil.',
  },
  {
    id: 'evt-06',
    eventTime: '17 May 2025, 08:52 AM',
    timestamp: 1747471920000,
    gate: 'GATE-01',
    direction: 'OUT',
    truckNo: 'RJ 14 GH 1357',
    containerNo: 'BMOU 987654 1',
    ocrResult: 'BMCU 987654 1',
    confidence: 99,
    driver: 'Manoj Mehta',
    status: 'Verified',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#8b4b3b', tag: 'BM' },
      { label: 'Left Side ISO', color: '#8b4b3b', tag: 'BM' },
      { label: 'Right Side ISO', color: '#8b4b3b', tag: 'BM' },
      { label: 'Rear Doors', color: '#8b4b3b', tag: 'BM' },
    ],
    notes: 'Check-out completed.',
  },
  {
    id: 'evt-07',
    eventTime: '17 May 2025, 08:45 AM',
    timestamp: 1747471500000,
    gate: 'GATE-03',
    direction: 'IN',
    truckNo: 'AP 28 XY 8642',
    containerNo: 'SEGU 456123 0',
    ocrResult: 'SEGU 456123 0',
    confidence: 92,
    driver: 'Ravi Teja',
    status: 'Review',
    damageFlag: true,
    photos: [
      { label: 'Front OCR', color: '#276b68', tag: 'SEG' },
      { label: 'Left Side ISO', color: '#276b68', tag: 'SEG' },
      { label: 'Right Side ISO', color: '#276b68', tag: 'SEG' },
      { label: 'Rear Doors', color: '#276b68', tag: 'SEG' },
    ],
    notes: 'Side panel scratch detected by AI damage vision.',
  },
  {
    id: 'evt-08',
    eventTime: '17 May 2025, 08:38 AM',
    timestamp: 1747471080000,
    gate: 'GATE-02',
    direction: 'OUT',
    truckNo: 'KA 51 AB 6789',
    containerNo: 'WANU 123987 6',
    ocrResult: 'WANU 123987 6',
    confidence: 88,
    driver: 'Sanjay Naik',
    status: 'Review',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#bc802c', tag: 'WAN' },
      { label: 'Left Side ISO', color: '#bc802c', tag: 'WAN' },
      { label: 'Right Side ISO', color: '#bc802c', tag: 'WAN' },
      { label: 'Rear Doors', color: '#bc802c', tag: 'WAN' },
    ],
    notes: 'Pending operator manual confirmation.',
  },
  {
    id: 'evt-09',
    eventTime: '17 May 2025, 08:30 AM',
    timestamp: 1747470600000,
    gate: 'GATE-01',
    direction: 'IN',
    truckNo: 'MH 04 ER 9012',
    containerNo: 'CMAU 998811 0',
    ocrResult: 'CMAU 998811 0',
    confidence: 98,
    driver: 'Deepak Patil',
    status: 'Verified',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#1a3e6f', tag: 'CMA' },
      { label: 'Left Side ISO', color: '#1a3e6f', tag: 'CMA' },
      { label: 'Right Side ISO', color: '#1a3e6f', tag: 'CMA' },
      { label: 'Rear Doors', color: '#1a3e6f', tag: 'CMA' },
    ],
    notes: 'CMA CGM line booking verified.',
  },
  {
    id: 'evt-10',
    eventTime: '17 May 2025, 08:22 AM',
    timestamp: 1747470120000,
    gate: 'GATE-02',
    direction: 'OUT',
    truckNo: 'DL 01 AA 2233',
    containerNo: 'KKFU 334455 9',
    ocrResult: 'KKFU 334455 9',
    confidence: 97,
    driver: 'Hardeep Singh',
    status: 'Verified',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#a02323', tag: 'KLINE' },
      { label: 'Left Side ISO', color: '#a02323', tag: 'KLINE' },
      { label: 'Right Side ISO', color: '#a02323', tag: 'KLINE' },
      { label: 'Rear Doors', color: '#a02323', tag: 'KLINE' },
    ],
    notes: 'Empty return passed.',
  },
];

@Component({
  selector: 'app-gate-events',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, GatePhotoStripComponent, ConfidenceBadgeComponent],
  templateUrl: './gate-events.component.html',
  styleUrls: ['./gate-events.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GateEventsComponent {
  public readonly events = signal<GateEventItem[]>(INITIAL_GATE_EVENTS);
  public readonly activeTab = signal<'all' | 'arrivals' | 'departures'>('all');
  public readonly directionFilter = signal<string>('All');
  public readonly gateFilter = signal<string>('All');
  public readonly confidenceFilter = signal<string>('All');
  public readonly dateFilter = signal<string>('17 May 2025');
  public readonly searchQuery = signal<string>('');

  public readonly selectedIds = signal<Set<string>>(new Set());
  public readonly selectedEventForDetails = signal<GateEventItem | null>(null);
  public readonly alertMessage = signal<string>('');

  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  // Metrics matching the reference UI cards
  public readonly metrics = computed(() => {
    return {
      todayArrivals: 28,
      arrivalsTrend: '+12% vs yesterday',
      todayDepartures: 22,
      departuresTrend: '+10% vs yesterday',
      ocrVerified: 76,
      ocrVerifiedPercent: "85% of today's events",
      pendingReview: 12,
      pendingReviewTrend: '-8% vs yesterday',
      damagedCaptures: 5,
      damagedTrend: '-17% vs yesterday',
    };
  });

  // Tab counts
  public readonly tabCounts = computed(() => {
    return {
      all: 50,
      arrivals: 28,
      departures: 22,
    };
  });

  // Filtered dataset
  public readonly filteredEvents = computed<GateEventItem[]>(() => {
    const list = this.events();
    const tab = this.activeTab();
    const dir = this.directionFilter();
    const gate = this.gateFilter();
    const conf = this.confidenceFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return list.filter((item) => {
      if (tab === 'arrivals' && item.direction !== 'IN') return false;
      if (tab === 'departures' && item.direction !== 'OUT') return false;

      if (dir !== 'All' && item.direction !== dir) return false;
      if (gate !== 'All' && item.gate !== gate) return false;

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
    // Fallback to first visible
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

  private showToast(msg: string): void {
    this.alertMessage.set(msg);
    setTimeout(() => {
      if (this.alertMessage() === msg) {
        this.alertMessage.set('');
      }
    }, 4000);
  }
}
