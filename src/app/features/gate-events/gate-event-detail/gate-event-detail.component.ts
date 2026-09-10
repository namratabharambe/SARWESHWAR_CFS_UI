import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
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

@Component({
  selector: 'app-gate-event-detail',
  standalone: true,
  imports: [CommonModule],
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
      'OCR Result',
      'Driver',
      'Transporter',
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
      this.event().ocrResult,
      det.driver,
      det.transporter,
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
    const cleanContainer = event.containerNo.replace(/\s+/g, '');
    const cleanTruck = event.truckNo.replace(/\s+/g, '');

    return {
      eventId,
      truckNo: cleanTruck || 'MH14AB1234',
      truckConfidence: Math.max(95, event.confidence),
      containerNo: cleanContainer || 'MSCU5561234',
      containerConfidence: Math.max(94, event.confidence),
      containerType: '45G1',
      typeConfidence: 97,
      fullOrEmpty: 'Full',
      fullEmptyConfidence: 96,
      sealNo: 'TCLU7890123',
      sealConfidence: 95,
      overallConfidence: event.confidence || 97,
      gate: event.gate === 'GATE-01' ? 'Gate 1' : event.gate === 'GATE-02' ? 'Gate 2' : 'Gate 3',
      terminal: 'Prosper CFS Terminal',
      driver: event.driver || 'Ramesh Kumar',
      driverPhone: '9876543210',
      transporter: 'Shree Logistics Pvt. Ltd.',
      appointmentId: `APPT-2025-05-17-${rawNumber.slice(-5)}`,
      operatorReviewStatus: 'Verified by Admin User',
      remarks: event.notes || 'No issues found',
      damageDetected: event.damageFlag,
      sealIntact: true,
      containerClean: true,
      doorCondition: 'Closed',
      temperatureReefer: 'N/A',
      capturedPhotos: [
        {
          title: '1. Front Gate Photo',
          timestamp: '17 May 2025, 10:24:01 AM',
          url: '/assets/gate/front-gate.jpg',
        },
        {
          title: '2. Side / Container Number',
          timestamp: '17 May 2025, 10:24:03 AM',
          url: '/assets/gate/container-stencil.jpg',
        },
        {
          title: '3. Truck Image',
          timestamp: '17 May 2025, 10:24:05 AM',
          url: '/assets/gate/truck-side.jpg',
        },
        {
          title: '4. Overview Image',
          timestamp: '17 May 2025, 10:24:07 AM',
          url: '/assets/gate/overview.jpg',
        },
      ],
      timelineSteps: [
        {
          label: 'Captured',
          time: '17 May 2025, 10:24:01 AM',
          actor: 'Camera System',
          icon: 'camera',
          color: 'blue',
        },
        {
          label: 'OCR Processed',
          time: '17 May 2025, 10:24:08 AM',
          actor: 'AI Engine',
          icon: 'target',
          color: 'purple',
        },
        {
          label: 'Verified',
          time: '17 May 2025, 10:24:18 AM',
          actor: 'Admin User',
          icon: 'shield',
          color: 'green',
        },
        {
          label: 'Task Created',
          time: '17 May 2025, 10:24:20 AM',
          actor: 'System',
          icon: 'task',
          color: 'amber',
        },
      ],
      systemNotes: [
        { text: 'OCR accuracy high across all key fields.', time: '10:24 AM' },
        { text: 'Container number matched with appointment.', time: '10:24 AM' },
        {
          text: event.damageFlag
            ? 'Structural anomaly flagged by vision engine.'
            : 'No exception detected.',
          time: '10:24 AM',
        },
      ],
    };
  }
}
