import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from 'shared/pipes';

export interface NonErpContainerItem {
  id: string;
  eventTime: string;
  gate: string;
  direction: 'IN' | 'OUT';
  truckNo: string;
  containerNo: string;
  isoCode: string;
  sizeType: string;
  ocrResult: string;
  confidence: number;
  driver: string;
  driverPhone: string;
  transporter: string;
  category: string;
  status: 'Verified' | 'Review' | 'Hold';
  damageFlag: boolean;
  remarks: string;
  imageUrl?: string;
  capturedPhotos?: Array<{ title: string; timestamp: string; tag: string; url: string }>;
}

@Component({
  selector: 'app-non-erp-container',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './non-erp-container.component.html',
  styleUrls: ['./non-erp-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NonErpContainerComponent {
  /** Gate direction mode: 'in' or 'out' */
  public readonly gateMode = input<'in' | 'out'>('in');

  /** Event emitted when back arrow is clicked in top right corner */
  public readonly back = output<void>();

  /** Event emitted to display a toast message in parent component */
  public readonly toast = output<string>();

  // Filter signals
  public readonly searchQuery = signal<string>('');
  public readonly statusFilter = signal<string>('ALL');
  public readonly gateFilter = signal<string>('ALL');
  public readonly selectedIds = signal<Set<string>>(new Set());

  // Modal / Detail states
  public readonly isAddModalOpen = signal<boolean>(false);
  public readonly selectedEventForDetails = signal<NonErpContainerItem | null>(null);
  public readonly activeLightboxImage = signal<{ url: string; title: string } | null>(null);

  // New Non-ERP container form model
  public newContainerForm = {
    containerNo: '',
    truckNo: '',
    sizeType: '40FT HC',
    gate: 'Gate 01',
    category: 'Direct Shipper Drop',
    driver: '',
    driverPhone: '',
    transporter: '',
    remarks: '',
  };

  // Sample data for Inbound Non-ERP containers
  private readonly inEvents = signal<NonErpContainerItem[]>([
    {
      id: 'NE-IN-101',
      eventTime: '11:42 AM',
      gate: 'Gate 01',
      direction: 'IN',
      truckNo: 'MH 12 RN 4589',
      containerNo: 'MSCU7823412',
      isoCode: '45G1',
      sizeType: '40FT HC',
      ocrResult: 'MSCU7823412',
      confidence: 98,
      driver: 'Rameshwar Singh',
      driverPhone: '+91 98220 12345',
      transporter: 'Trans India Logistics',
      category: 'Direct Shipper Drop',
      status: 'Verified',
      damageFlag: false,
      remarks: 'Off-ERP direct entry from local factory.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
      capturedPhotos: [
        {
          title: 'Front OCR Camera',
          timestamp: '11:42:04 AM',
          tag: 'CAM-01',
          url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
        },
        {
          title: 'Rear Plate Capture',
          timestamp: '11:42:06 AM',
          tag: 'CAM-02',
          url: 'https://images.unsplash.com/photo-1586528116493-ce05bf1246b8?w=800&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'NE-IN-102',
      eventTime: '11:15 AM',
      gate: 'Gate 02',
      direction: 'IN',
      truckNo: 'MH 46 BB 7812',
      containerNo: 'TGHU9821345',
      isoCode: '22G1',
      sizeType: '20FT Standard',
      ocrResult: 'TGHU9821345',
      confidence: 96,
      driver: 'Gurmeet Singh',
      driverPhone: '+91 98450 78901',
      transporter: 'Northern Freightways',
      category: 'Empty Repositioning',
      status: 'Verified',
      damageFlag: false,
      remarks: 'Empty repositioning shunt from railhead without EDI order.',
      imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=300&auto=format&fit=crop&q=80',
      capturedPhotos: [
        {
          title: 'Top Bay Inspection',
          timestamp: '11:15:12 AM',
          tag: 'CAM-03',
          url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'NE-IN-103',
      eventTime: '10:38 AM',
      gate: 'Gate 01',
      direction: 'IN',
      truckNo: 'DL 01 AB 9021',
      containerNo: 'CXIU3412980',
      isoCode: '45R1',
      sizeType: '40FT Reefer',
      ocrResult: 'CXIU3412980',
      confidence: 88,
      driver: 'Mohammed Arif',
      driverPhone: '+91 99100 55432',
      transporter: 'Apex Cool Logistics',
      category: 'Emergency Storage',
      status: 'Review',
      damageFlag: false,
      remarks: 'Reefer container power required urgently; ERP booking not linked yet.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116493-ce05bf1246b8?w=300&auto=format&fit=crop&q=80',
      capturedPhotos: [
        {
          title: 'Front Reefer Plug',
          timestamp: '10:38:22 AM',
          tag: 'CAM-01',
          url: 'https://images.unsplash.com/photo-1586528116493-ce05bf1246b8?w=800&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'NE-IN-104',
      eventTime: '09:50 AM',
      gate: 'Gate 03',
      direction: 'IN',
      truckNo: 'KA 04 MM 3344',
      containerNo: 'HLXU5612349',
      isoCode: '45G1',
      sizeType: '40FT HC',
      ocrResult: 'HLXU5612349',
      confidence: 72,
      driver: 'Suresh Patil',
      driverPhone: '+91 97312 99887',
      transporter: 'Deccan Coastal Haulage',
      category: 'Off-Hire Return',
      status: 'Hold',
      damageFlag: true,
      remarks: 'Minor corner casting dent detected by AI damage model. Physical check requested.',
      imageUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=300&auto=format&fit=crop&q=80',
      capturedPhotos: [
        {
          title: 'AI Damage Inspection Area',
          timestamp: '09:50:45 AM',
          tag: 'CAM-04',
          url: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80',
        },
      ],
    },
  ]);

  // Sample data for Outbound Non-ERP containers
  private readonly outEvents = signal<NonErpContainerItem[]>([
    {
      id: 'NE-OUT-201',
      eventTime: '11:30 AM',
      gate: 'Gate 02',
      direction: 'OUT',
      truckNo: 'MH 04 KD 6721',
      containerNo: 'TEMU4512983',
      isoCode: '22G1',
      sizeType: '20FT Standard',
      ocrResult: 'TEMU4512983',
      confidence: 99,
      driver: 'Vikas Sharma',
      driverPhone: '+91 98200 44556',
      transporter: 'Western Carriers',
      category: 'Empty Depot Repositioning Out',
      status: 'Verified',
      damageFlag: false,
      remarks: 'Repositioning empty box out to Nhava Sheva depot without ERP job order.',
      imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=300&auto=format&fit=crop&q=80',
      capturedPhotos: [
        {
          title: 'Outbound Gate 02 Capture',
          timestamp: '11:30:15 AM',
          tag: 'CAM-02',
          url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'NE-OUT-202',
      eventTime: '10:45 AM',
      gate: 'Gate 01',
      direction: 'OUT',
      truckNo: 'MH 14 CC 8829',
      containerNo: 'BMOU6723419',
      isoCode: '45G1',
      sizeType: '40FT HC',
      ocrResult: 'BMOU6723419',
      confidence: 97,
      driver: 'Balwinder Singh',
      driverPhone: '+91 98112 33445',
      transporter: 'Punjab Speed Roadways',
      category: 'Direct Consignee Dispatch',
      status: 'Verified',
      damageFlag: false,
      remarks: 'Manual gate pass issued by gate master for direct consignee dispatch.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
      capturedPhotos: [
        {
          title: 'Outbound Seal & Plate Verification',
          timestamp: '10:45:03 AM',
          tag: 'CAM-01',
          url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
        },
      ],
    },
    {
      id: 'NE-OUT-203',
      eventTime: '09:20 AM',
      gate: 'Gate 03',
      direction: 'OUT',
      truckNo: 'GJ 06 XX 1122',
      containerNo: 'SEGU3412098',
      isoCode: '45G1',
      sizeType: '40FT HC',
      ocrResult: 'SEGU3412098',
      confidence: 84,
      driver: 'Hasmukh Patel',
      driverPhone: '+91 99250 88776',
      transporter: 'Gujarat Freight Express',
      category: 'Workshop / Repair Exit',
      status: 'Review',
      damageFlag: true,
      remarks: 'Outgoing for offsite body shop welding; gate pass signed manually.',
      imageUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=300&auto=format&fit=crop&q=80',
      capturedPhotos: [
        {
          title: 'Outbound Damage Confirmation',
          timestamp: '09:20:10 AM',
          tag: 'CAM-03',
          url: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80',
        },
      ],
    },
  ]);

  /** Active event list based on gate mode */
  public readonly activeEvents = computed(() => {
    return this.gateMode() === 'out' ? this.outEvents() : this.inEvents();
  });

  /** Filtered events */
  public readonly filteredEvents = computed(() => {
    const list = this.activeEvents();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const gate = this.gateFilter();

    return list.filter((item) => {
      const matchesQuery =
        !query ||
        item.containerNo.toLowerCase().includes(query) ||
        item.truckNo.toLowerCase().includes(query) ||
        item.driver.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesStatus = status === 'ALL' || item.status.toUpperCase() === status.toUpperCase();
      const matchesGate = gate === 'ALL' || item.gate === gate;

      return matchesQuery && matchesStatus && matchesGate;
    });
  });

  /** Dynamic KPI metrics */
  public readonly metrics = computed(() => {
    const list = this.activeEvents();
    const total = list.length;
    const verified = list.filter((e) => e.status === 'Verified').length;
    const review = list.filter((e) => e.status === 'Review').length;
    const hold = list.filter((e) => e.status === 'Hold').length;
    const avgConfidence = total > 0 ? Math.round(list.reduce((acc, e) => acc + e.confidence, 0) / total) : 96;

    return {
      total,
      verified,
      review,
      hold,
      avgConfidence,
    };
  });

  // Actions
  public toggleSelectAll(): void {
    const current = this.filteredEvents();
    const selected = new Set(this.selectedIds());
    if (this.selectedIds().size === current.length && current.length > 0) {
      selected.clear();
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

  public openDetails(event: NonErpContainerItem): void {
    this.selectedEventForDetails.set(event);
  }

  public closeDetails(): void {
    this.selectedEventForDetails.set(null);
  }

  public approveEvent(event: NonErpContainerItem): void {
    const updateTarget = this.gateMode() === 'out' ? this.outEvents : this.inEvents;
    updateTarget.update((items) => items.map((i) => (i.id === event.id ? { ...i, status: 'Verified' as const } : i)));
    this.toast.emit(`Non-ERP Container ${event.containerNo} approved as Verified.`);
  }

  public flagInspection(event: NonErpContainerItem): void {
    const updateTarget = this.gateMode() === 'out' ? this.outEvents : this.inEvents;
    updateTarget.update((items) =>
      items.map((i) => (i.id === event.id ? { ...i, status: 'Review' as const, damageFlag: true } : i)),
    );
    this.toast.emit(`Non-ERP Container ${event.containerNo} flagged for review.`);
  }

  public openAddModal(): void {
    this.newContainerForm = {
      containerNo: '',
      truckNo: '',
      sizeType: '40FT HC',
      gate: 'Gate 01',
      category: 'Direct Shipper Drop',
      driver: '',
      driverPhone: '',
      transporter: '',
      remarks: '',
    };
    this.isAddModalOpen.set(true);
  }

  public closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  public saveNewContainer(): void {
    if (!this.newContainerForm.containerNo || !this.newContainerForm.truckNo) {
      this.toast.emit('Please fill in Container Number and Truck Number.');
      return;
    }

    const newItem: NonErpContainerItem = {
      id: `NE-${this.gateMode().toUpperCase()}-${Date.now().toString().slice(-4)}`,
      eventTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gate: this.newContainerForm.gate,
      direction: this.gateMode().toUpperCase() as 'IN' | 'OUT',
      truckNo: this.newContainerForm.truckNo.toUpperCase().trim(),
      containerNo: this.newContainerForm.containerNo.toUpperCase().trim(),
      isoCode: this.newContainerForm.sizeType.includes('20') ? '22G1' : '45G1',
      sizeType: this.newContainerForm.sizeType,
      ocrResult: this.newContainerForm.containerNo.toUpperCase().trim(),
      confidence: 99,
      driver: this.newContainerForm.driver || 'Driver Unknown',
      driverPhone: this.newContainerForm.driverPhone || '-',
      transporter: this.newContainerForm.transporter || 'Direct Haulier',
      category: this.newContainerForm.category,
      status: 'Verified',
      damageFlag: false,
      remarks: this.newContainerForm.remarks || 'Manual Non-ERP entry.',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
    };

    const targetList = this.gateMode() === 'out' ? this.outEvents : this.inEvents;
    targetList.update((items) => [newItem, ...items]);

    this.closeAddModal();
    this.toast.emit(`Non-ERP Container ${newItem.containerNo} added successfully.`);
  }

  public openLightbox(url?: string, title?: string): void {
    if (url) {
      this.activeLightboxImage.set({ url, title: title || 'Non-ERP Container Inspection' });
    }
  }

  public closeLightbox(): void {
    this.activeLightboxImage.set(null);
  }

  public exportCsv(): void {
    const data = this.filteredEvents();
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Time,Gate,Direction,Truck No,Container No,Size,Confidence,Driver,Category,Status']
        .concat(
          data.map(
            (e) =>
              `"${e.id}","${e.eventTime}","${e.gate}","${e.direction}","${e.truckNo}","${e.containerNo}","${e.sizeType}",${e.confidence}%,"${e.driver}","${e.category}","${e.status}"`,
          ),
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `non-erp-containers-${this.gateMode()}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.emit('Exporting Non-ERP container log to CSV.');
  }
}
