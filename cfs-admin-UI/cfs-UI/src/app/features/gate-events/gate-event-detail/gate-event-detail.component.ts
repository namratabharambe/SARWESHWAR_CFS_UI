import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { GateEventItem, GateContainerRecord } from '../gate-events.component';
import { TranslatePipe } from 'shared/pipes';

export interface ContainerDetailInfo {
  index: number;
  label: string;
  containerNo: string;
  confidence: number;
  isoCode: string;
  size: string;
  typeConfidence: number;
  fullOrEmpty: string;
  fullEmptyConfidence: number;
  tareWeight: string;
  sealNo1: string;
  sealNo2: string;
  customSealNo: string;
  cargoType: string;
  location: string;
  condition: string;
  damageDetected: boolean;
  capturedPhotos: Array<{
    title: string;
    timestamp: string;
    url: string;
    tag?: string;
  }>;
}

export interface GateEventDetailData {
  eventId: string;
  truckNo: string;
  truckConfidence: number;
  isDualContainer: boolean;
  containers: ContainerDetailInfo[];

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
  public readonly selectedContainerIndex = signal<number>(0);
  public readonly copyFeedback = signal<boolean>(false);
  public readonly exportDropdownOpen = signal<boolean>(false);
  public readonly activeLightboxPhoto = signal<{ title: string; url: string } | null>(null);

  /** Computed detail object based on the input event */
  public readonly detail = computed<GateEventDetailData>(() => {
    const ev = this.event();
    return this.buildEventDetail(ev);
  });

  /** Active container record when dual/multi-container */
  public readonly activeContainer = computed<ContainerDetailInfo>(() => {
    const d = this.detail();
    const idx = this.selectedContainerIndex();
    if (d.containers && d.containers.length > idx) {
      return d.containers[idx];
    }
    return (
      d.containers?.[0] || {
        index: 1,
        label: 'Container 1 (20 FT)',
        containerNo: d.containerNo,
        confidence: d.containerConfidence,
        isoCode: d.isoCode,
        size: d.size,
        typeConfidence: d.typeConfidence,
        fullOrEmpty: d.fullOrEmpty,
        fullEmptyConfidence: d.fullEmptyConfidence,
        tareWeight: d.tareWeight,
        sealNo1: d.sealNo1,
        sealNo2: d.sealNo2,
        customSealNo: d.customSealNo,
        cargoType: d.cargoType,
        location: d.location,
        condition: d.condition,
        damageDetected: d.damageDetected,
        capturedPhotos: d.capturedPhotos,
      }
    );
  });

  public selectContainerTab(idx: number): void {
    this.selectedContainerIndex.set(idx);
  }

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
    const activeC = this.activeContainer();
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
      activeC.containerNo,
      activeC.isoCode,
      activeC.size,
      det.driver,
      det.transporter,
      det.shippingLine,
      activeC.sealNo1,
      det.portName,
      activeC.location,
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
    const cleanTruck = event.truckNo ? event.truckNo.replace(/\s+/g, '') : 'MH12AB1234';
    const eventTime = event.eventTime || '15 Sept 2026, 01:53 PM';

    const isDual = event.isDualContainer || (event.containers && event.containers.length > 1);

    // Build container list
    const containers: ContainerDetailInfo[] = [];

    if (event.containers && event.containers.length > 0) {
      event.containers.forEach((c, idx) => {
        const cPhotos =
          c.photos && c.photos.length > 0
            ? c.photos.map((p, pIdx) => ({
                title: `${pIdx + 1}. ${p.label || `Container ${idx + 1} Scan`}`,
                timestamp: eventTime,
                url: p.url || 'assets/gate/container-stencil.jpg',
                tag: p.tag || `C${idx + 1}`,
              }))
            : [
                {
                  title: `1. Container ${idx + 1} (20FT) - Front OCR`,
                  timestamp: eventTime,
                  url: 'assets/gate/container-stencil.jpg',
                  tag: 'FRONT',
                },
                {
                  title: `2. Container ${idx + 1} (20FT) - Left Side ISO`,
                  timestamp: eventTime,
                  url: 'assets/gate/truck-side.jpg',
                  tag: 'LEFT',
                },
                {
                  title: `3. Container ${idx + 1} (20FT) - Right Side ISO`,
                  timestamp: eventTime,
                  url: 'assets/gate/overview.jpg',
                  tag: 'RIGHT',
                },
                {
                  title: `4. Container ${idx + 1} (20FT) - Rear Doors`,
                  timestamp: eventTime,
                  url: 'assets/gate/front-gate.jpg',
                  tag: 'REAR',
                },
              ];

        containers.push({
          index: idx + 1,
          label: `Container ${idx + 1} (${c.size || '20 FT'})`,
          containerNo: c.containerNo ? c.containerNo.replace(/\s+/g, '') : `MSCU20491${idx}2`,
          confidence: c.confidence || 96,
          isoCode: c.isoCode || (c.size?.includes('20') ? '22G1' : '45G1'),
          size: c.size || (isDual ? '20 FT' : '40 FT'),
          typeConfidence: 97,
          fullOrEmpty: c.fullOrEmpty || 'Full',
          fullEmptyConfidence: 96,
          tareWeight: c.tareWeight || (c.size?.includes('20') ? '2,250 kg' : '3,800 kg'),
          sealNo1: c.sealNo1 || (idx === 0 ? 'MSCU-S1-9981' : 'TCLU-S2-8114'),
          sealNo2: c.sealNo2 || (idx === 0 ? 'MSCU-S2-4412' : 'TCLU-S3-5591'),
          customSealNo: c.customSealNo || (idx === 0 ? 'CUST-8831' : 'CUST-8832'),
          cargoType: c.cargoType || 'General Cargo',
          location: c.location || (idx === 0 ? 'A SHEL' : 'B YARD'),
          condition: c.condition || 'Sound',
          damageDetected: c.damageFlag || false,
          capturedPhotos: cPhotos,
        });
      });
    } else {
      const cleanContainer = event.containerNo ? event.containerNo.replace(/\s+/g, '') : 'MSCU2049182';
      const containerSize = event.rawVisit?.containerSize || event.rawDto?.container?.size || '20 FT';
      const isoCode = containerSize.includes('20') ? '22G1' : '45G1';

      containers.push({
        index: 1,
        label: `Container 1 (${containerSize})`,
        containerNo: cleanContainer,
        confidence: event.confidence || 95,
        isoCode,
        size: containerSize,
        typeConfidence: 97,
        fullOrEmpty: 'Full',
        fullEmptyConfidence: 96,
        tareWeight: containerSize.includes('20') ? '2,250 kg' : '3,800 kg',
        sealNo1: 'MSCU-S1-9981',
        sealNo2: 'MSCU-S2-4412',
        customSealNo: 'CUST-8831',
        cargoType: 'General Cargo',
        location: 'A SHEL',
        condition: 'Sound',
        damageDetected: event.damageFlag || false,
        capturedPhotos:
          event.photos && event.photos.length > 0
            ? event.photos.map((p, idx) => ({
                title: `${idx + 1}. ${p.label || 'Camera Scan'}`,
                timestamp: eventTime,
                url: p.url || 'assets/gate/container-stencil.jpg',
                tag: p.tag || 'CAM',
              }))
            : [
                {
                  title: '1. Front OCR (20FT)',
                  timestamp: eventTime,
                  url: 'assets/gate/container-stencil.jpg',
                  tag: 'FRONT',
                },
                {
                  title: '2. Left Side ISO',
                  timestamp: eventTime,
                  url: 'assets/gate/truck-side.jpg',
                  tag: 'LEFT',
                },
                {
                  title: '3. Right Side ISO',
                  timestamp: eventTime,
                  url: 'assets/gate/overview.jpg',
                  tag: 'RIGHT',
                },
                {
                  title: '4. Rear Doors',
                  timestamp: eventTime,
                  url: 'assets/gate/front-gate.jpg',
                  tag: 'REAR',
                },
              ],
      });

      if (isDual || containerSize.includes('20')) {
        containers.push({
          index: 2,
          label: 'Container 2 (20 FT)',
          containerNo: 'TCLU8192031',
          confidence: 96,
          isoCode: '22G1',
          size: '20 FT',
          typeConfidence: 97,
          fullOrEmpty: 'Full',
          fullEmptyConfidence: 95,
          tareWeight: '2,280 kg',
          sealNo1: 'TCLU-S2-8114',
          sealNo2: 'TCLU-S3-5591',
          customSealNo: 'CUST-8832',
          cargoType: 'General Cargo',
          location: 'B YARD',
          condition: 'Sound',
          damageDetected: false,
          capturedPhotos: [
            {
              title: '1. Container 2 (20FT) - Front OCR',
              timestamp: eventTime,
              url: 'assets/gate/container-stencil.jpg',
              tag: 'C2-FRONT',
            },
            {
              title: '2. Container 2 (20FT) - Left Side ISO',
              timestamp: eventTime,
              url: 'assets/gate/truck-side.jpg',
              tag: 'C2-LEFT',
            },
            {
              title: '3. Container 2 (20FT) - Right Side ISO',
              timestamp: eventTime,
              url: 'assets/gate/overview.jpg',
              tag: 'C2-RIGHT',
            },
            {
              title: '4. Container 2 (20FT) - Rear Doors',
              timestamp: eventTime,
              url: 'assets/gate/front-gate.jpg',
              tag: 'C2-REAR',
            },
          ],
        });
      }
    }

    const primary = containers[0];
    const allCapturedPhotos: Array<{ title: string; timestamp: string; url: string }> = [];
    containers.forEach((c) => {
      allCapturedPhotos.push(...c.capturedPhotos);
    });

    const isTwin = containers.length > 1;

    return {
      eventId,
      truckNo: cleanTruck || 'MH12AB1234',
      truckConfidence: Math.max(95, event.confidence || 95),
      isDualContainer: isTwin,
      containers,

      containerNo: isTwin ? containers.map((c) => c.containerNo).join(', ') : primary.containerNo,
      containerConfidence: primary.confidence,
      containerType: primary.isoCode,
      typeConfidence: primary.typeConfidence,
      fullOrEmpty: primary.fullOrEmpty,
      fullEmptyConfidence: primary.fullEmptyConfidence,
      sealNo: primary.sealNo1,
      sealConfidence: 95,
      overallConfidence: event.confidence || 96,
      gate: event.gate === 'GATE-01' ? 'Gate 1' : event.gate === 'GATE-02' ? 'Gate 2' : event.gate || 'GATE-01A0',
      terminal: 'Prosper CFS Terminal',
      driver: event.driver || 'Driver (Unassigned)',
      driverPhone: '9876543210',
      transporter: 'Shree Logistics Pvt. Ltd.',
      appointmentId: `APPT-2025-05-17-${rawNumber.slice(-5)}`,
      operatorReviewStatus: event.status === 'Verified' ? 'Verified by Admin User' : 'Pending Review',
      remarks: event.notes || (isTwin ? '2x 20FT twin container load verified at gate' : 'Clean container, verified at gate'),
      damageDetected: event.damageFlag,
      sealIntact: true,
      containerClean: true,
      doorCondition: 'Closed',
      temperatureReefer: 'N/A',

      // CFS Operational Details
      isoCode: primary.isoCode,
      size: isTwin ? '2x 20 FT (Twin Load)' : primary.size,
      tareWeight: primary.tareWeight,
      type: 'Dry Standard',
      cargoType: primary.cargoType,
      joType: 'Air Import',
      fclLcl: 'FCL',
      scanType: 'Full Optical Dual-Scan',
      offLoadLocation: 'Yard Bay 04',
      gateInType: event.direction === 'OUT' ? 'Export Departure' : 'Import Loaded',
      vesselName: 'MSC ARIES / V-204',
      portName: 'BMCT',
      shippingLine: 'Mediterranean Shipping Company (MSC)',
      igmSeal: 'IGM-98412',
      sealNo1: primary.sealNo1,
      sealNo2: primary.sealNo2,
      customSealNo: primary.customSealNo,
      customerName: 'Apex Global Logistics',
      eirNo: `EIR-2026-${rawNumber.slice(-4) || '9041'}`,
      eirWeight: isTwin ? '48,900 kg' : '28,450 kg',
      eirDateTime: eventTime,
      location: primary.location,
      condition: primary.condition,
      doorToDoor: 'Yes',

      capturedPhotos: allCapturedPhotos.length > 0 ? allCapturedPhotos : primary.capturedPhotos,
      timelineSteps: [
        {
          label: 'Gate Arrival & Camera Scan',
          time: eventTime,
          actor: 'Camera System',
          icon: 'camera',
          color: 'blue',
        },
        {
          label: isTwin ? 'OCR Processed (Both 20FT Containers)' : 'OCR Processed',
          time: eventTime,
          actor: 'AI Vision Engine',
          icon: 'target',
          color: 'purple',
        },
        {
          label: 'Verified & Registered',
          time: eventTime,
          actor: event.driver || 'Admin User',
          icon: 'shield',
          color: 'green',
        },
        {
          label: 'Yard Movement Task Created',
          time: eventTime,
          actor: 'CFS Terminal Dispatch',
          icon: 'task',
          color: 'amber',
        },
      ],
      systemNotes: [
        {
          text: isTwin
            ? `Twin 20FT Load: Both containers (${containers.map((c) => c.containerNo).join(' & ')}) scanned & verified.`
            : `Live visit record synchronized from CFS Gate API (${eventId}).`,
          time: eventTime,
        },
        {
          text: `Container 1 (${containers[0].containerNo}) matched ISO 22G1 size standard with high confidence.`,
          time: eventTime,
        },
        ...(isTwin && containers[1]
          ? [
              {
                text: `Container 2 (${containers[1].containerNo}) matched ISO 22G1 size standard with high confidence.`,
                time: eventTime,
              },
            ]
          : []),
        {
          text: event.damageFlag ? 'Structural anomaly flagged by vision engine.' : 'No exception detected on either container.',
          time: eventTime,
        },
      ],
    };
  }
}

