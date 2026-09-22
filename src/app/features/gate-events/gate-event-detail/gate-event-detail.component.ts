import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { GateEventItem } from '../gate-events.component';

export interface GateEventDetailData {
  eventId: string;
  truckNo: string;
  truckConfidence: number;
  containerNo: string;
  containerConfidence: number;
  containerType: string;
  typeConfidence: number;
  fullOrEmpty: string;
  fullEmptyConfidence: number;
  sealNo: string;
  sealConfidence: number;
  overallConfidence: number;
  gate: string;
  terminal: string;
  driver: string;
  driverPhone: string;
  transporter: string;
  appointmentId: string;
  operatorReviewStatus: string;
  remarks: string;
  damageDetected: boolean;
  sealIntact: boolean;
  containerClean: boolean;
  doorCondition: string;
  temperatureReefer: string;

  // Operational CFS Fields
  isoCode: string;
  size: string;
  tareWeight: string;
  type: string;
  cargoType: string;
  joType: string;
  fclLcl: string;
  scanType: string;
  offLoadLocation: string;
  gateInType: string;
  vesselName: string;
  portName: string;
  shippingLine: string;
  igmSeal: string;
  sealNo1: string;
  sealNo2: string;
  customSealNo: string;
  customerName: string;
  eirNo: string;
  eirWeight: string;
  eirDateTime: string;
  location: string;
  condition: string;
  doorToDoor: string;

  capturedPhotos: Array<{
    title: string;
    timestamp: string;
    url: string;
  }>;
  timelineSteps: Array<{
    label: string;
    time: string;
    actor: string;
    icon: 'camera' | 'target' | 'shield' | 'task';
    color: string;
  }>;
  systemNotes: Array<{
    text: string;
    time: string;
  }>;
}

import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-gate-event-detail',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './gate-event-detail.component.html',
  styleUrls: ['./gate-event-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GateEventDetailComponent {
  /** The selected gate event record */
  public readonly event = input.required<GateEventItem>();

  /** Outputs back to the parent component */
  public readonly back = output<void>();
  public readonly approve = output<GateEventItem>();
  public readonly markException = output<GateEventItem>();
  public readonly reRunOcr = output<GateEventItem>();
  public readonly createTask = output<GateEventItem>();
  public readonly toast = output<string>();

  /** Internal UI state signals */
  public readonly copyFeedback = signal<boolean>(false);
  public readonly exportDropdownOpen = signal<boolean>(false);
  public readonly activeLightboxPhoto = signal<{ title: string; url: string } | null>(null);

  /** Computed detail object based on the input event */
  public readonly detail = computed<GateEventDetailData>(() => {
    const ev = this.event();
    return this.buildEventDetail(ev);
  });

  public onBack(): void {
    this.back.emit();
  }

  public onApprove(): void {
    this.approve.emit(this.event());
  }

  public onMarkException(): void {
    this.markException.emit(this.event());
  }

  public onReRunOcr(): void {
    this.reRunOcr.emit(this.event());
  }

  public onCreateTask(): void {
    this.createTask.emit(this.event());
  }

  public copyEventId(idStr: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(idStr);
    }
    this.copyFeedback.set(true);
    this.toast.emit(`Event ID ${idStr} copied to clipboard`);
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

  public exportEventJson(): void {
    this.exportDropdownOpen.set(false);
    const ev = this.event();
    const det = this.detail();
    const blob = new Blob([JSON.stringify({ ...ev, detail: det }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${det.eventId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast.emit(`Exported ${det.eventId} details as JSON`);
  }

  public exportEventCsv(): void {
    this.exportDropdownOpen.set(false);
    const det = this.detail();
    const headers = [
      'Event ID',
      'Direction',
      'Status',
      'Event Time',
      'Gate',
      'Truck No',
      'Container No',
      'ISO Code',
      'Size',
      'Driver',
      'Transporter',
      'Shipping Line',
      'Seal No 1',
      'Port Name',
      'Location',
      'Appointment',
    ];
    const row = [
      det.eventId,
      this.event().direction,
      this.event().status,
      this.event().eventTime,
      det.gate,
      det.truckNo,
      det.containerNo,
      det.isoCode,
      det.size,
      det.driver,
      det.transporter,
      det.shippingLine,
      det.sealNo1,
      det.portName,
      det.location,
      det.appointmentId,
    ];
    const csvContent = `${headers.join(',')}\n${row.map((val) => `"${val}"`).join(',')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${det.eventId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast.emit(`Exported ${det.eventId} details as CSV`);
  }

  public openLightbox(title: string, url: string, e?: MouseEvent): void {
    if (e) e.stopPropagation();
    this.activeLightboxPhoto.set({ title, url });
  }

  public closeLightbox(): void {
    this.activeLightboxPhoto.set(null);
  }

  public buildEventDetail(event: GateEventItem): GateEventDetailData {
    const rawNumber = event.id.replace('evt-', '').padStart(6, '0');
    const eventId = `GE-2025-05-17-${rawNumber}`;
    const cleanContainer = event.containerNo ? event.containerNo.replace(/\s+/g, '') : '';
    const cleanTruck = event.truckNo ? event.truckNo.replace(/\s+/g, '') : '';
    const containerSize = event.rawVisit?.containerSize || event.rawDto?.container?.size || '40 FT';
    const isoCode = containerSize.includes('20') ? '22G1' : '45G1';
    const eventTime = event.eventTime || '15 Sept 2026, 01:53 PM';

    return {
      eventId,
      truckNo: cleanTruck || 'MH12AB1234',
      truckConfidence: Math.max(95, event.confidence || 95),
      containerNo: cleanContainer || 'MSCU1234567',
      containerConfidence: Math.max(94, event.confidence || 95),
      containerType: isoCode,
      typeConfidence: 97,
      fullOrEmpty: 'Full',
      fullEmptyConfidence: 96,
      sealNo: 'MSCU-S1-9981',
      sealConfidence: 95,
      overallConfidence: event.confidence || 95,
      gate: event.gate === 'GATE-01' ? 'Gate 1' : event.gate === 'GATE-02' ? 'Gate 2' : event.gate || 'GATE-01A0',
      terminal: 'Prosper CFS Terminal',
      driver: event.driver || 'Driver (Unassigned)',
      driverPhone: '9876543210',
      transporter: 'Shree Logistics Pvt. Ltd.',
      appointmentId: `APPT-2025-05-17-${rawNumber.slice(-5)}`,
      operatorReviewStatus: event.status === 'Verified' ? 'Verified by Admin User' : 'Pending Review',
      remarks: event.notes || 'Clean container, verified at gate',
      damageDetected: event.damageFlag,
      sealIntact: true,
      containerClean: true,
      doorCondition: 'Closed',
      temperatureReefer: 'N/A',

      // CFS Operational Details
      isoCode,
      size: containerSize,
      tareWeight: '3,800 kg',
      type: 'Dry Standard',
      cargoType: 'General',
      joType: 'Air Import',
      fclLcl: 'FCL',
      scanType: 'Full Optical Scan',
      offLoadLocation: 'Yard Bay 04',
      gateInType: event.direction === 'OUT' ? 'Export Departure' : 'Import Loaded',
      vesselName: 'MSC ARIES / V-204',
      portName: 'BMCT',
      shippingLine: 'Mediterranean Shipping Company (MSC)',
      igmSeal: 'IGM-98412',
      sealNo1: 'MSCU-S1-9981',
      sealNo2: 'MSCU-S2-4412',
      customSealNo: 'CUST-8831',
      customerName: 'Apex Global Logistics',
      eirNo: `EIR-2026-${rawNumber.slice(-4) || '9041'}`,
      eirWeight: '28,450 kg',
      eirDateTime: eventTime,
      location: 'A SHEL',
      condition: 'Sound',
      doorToDoor: 'Yes',

      capturedPhotos:
        event.photos && event.photos.length > 0
          ? event.photos.map((p, idx) => ({
              title: `${idx + 1}. ${p.label || 'Camera Scan'}`,
              timestamp: eventTime,
              url: p.url || '',
            }))
          : [],
      timelineSteps: [
        {
          label: 'Captured',
          time: eventTime,
          actor: 'Camera System',
          icon: 'camera',
          color: 'blue',
        },
        {
          label: 'OCR Processed',
          time: eventTime,
          actor: 'AI Engine',
          icon: 'target',
          color: 'purple',
        },
        {
          label: 'Verified',
          time: eventTime,
          actor: event.driver || 'Admin User',
          icon: 'shield',
          color: 'green',
        },
        {
          label: 'Task Created',
          time: eventTime,
          actor: 'System',
          icon: 'task',
          color: 'amber',
        },
      ],
      systemNotes: [
        { text: 'OCR accuracy high across all key fields.', time: eventTime },
        { text: `Container ${cleanContainer || 'MSCU1234567'} matched with manifest.`, time: eventTime },
        {
          text: event.damageFlag ? 'Structural anomaly flagged by vision engine.' : 'No exception detected.',
          time: eventTime,
        },
      ],
    };
  }
}
