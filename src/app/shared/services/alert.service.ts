import { Injectable, computed, signal } from '@angular/core';
import {
  AlertKpiMetrics,
  AlertResolutionRequest,
  AlertSeverity,
  AlertStatus,
  AlertType,
  ContainerMismatchAlert,
} from 'shared/types/alert/alert.interface';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly initialAlerts: ContainerMismatchAlert[] = [
    {
      id: 'alert-1',
      alertCode: 'ALT-MM-2025-0101',
      alertType: 'Container Number Mismatch',
      severity: 'Critical',
      status: 'Active',
      timestamp: '2025-05-17T08:42:00Z',
      gateLocation: 'GATE-01 (Inbound Main)',
      truckNo: 'MH-04-GP-8891',
      driverName: 'Ramdas Shinde',
      driverLicense: 'DL-0920194812',
      scannedContainerNo: 'MSCU 556123 4',
      expectedContainerNo: 'MSCU 556128 4',
      scannedSealNo: 'ML-IN-982341',
      expectedSealNo: 'ML-IN-982341',
      measuredWeightKg: 28450,
      manifestWeightKg: 28450,
      weightVariancePercentage: 0,
      ocrConfidence: 97.4,
      shippingLine: 'MSC Mediterranean Shipping',
      bookingNo: 'BKGS2051709',
      isoType: "40' HC (42G1)",
      systemRecommendation: 'Optical OCR scanned digit 3 at index 9 does not match manifest digit 8. Inspect physical door markings and re-verify container serial check digit.',
      comparisonFields: [
        {
          fieldName: 'Container ISO Serial',
          scannedOcrValue: 'MSCU 556123 4',
          manifestExpectedValue: 'MSCU 556128 4',
          hasDiscrepancy: true,
          confidenceScore: 97.4,
        },
        {
          fieldName: 'Check Digit Calculation',
          scannedOcrValue: 'Valid (4)',
          manifestExpectedValue: 'Mismatch with Serial',
          hasDiscrepancy: true,
        },
        {
          fieldName: 'Customs Seal No.',
          scannedOcrValue: 'ML-IN-982341',
          manifestExpectedValue: 'ML-IN-982341',
          hasDiscrepancy: false,
          confidenceScore: 99.1,
        },
        {
          fieldName: 'Gross Weight',
          scannedOcrValue: '28,450 KG',
          manifestExpectedValue: '28,450 KG',
          hasDiscrepancy: false,
        },
      ],
    },
    {
      id: 'alert-2',
      alertCode: 'ALT-MM-2025-0102',
      alertType: 'Weight Variance Exceeded',
      severity: 'High',
      status: 'Under Review',
      timestamp: '2025-05-17T08:50:00Z',
      gateLocation: 'GATE-01 (Inbound Main Weighbridge)',
      truckNo: 'GJ-06-ZZ-4412',
      driverName: 'Kishan Patel',
      driverLicense: 'GJ-440219481',
      scannedContainerNo: 'HMMU 123456 7',
      expectedContainerNo: 'HMMU 123456 7',
      scannedSealNo: 'EXP-SEAL-7712',
      expectedSealNo: 'EXP-SEAL-7712',
      measuredWeightKg: 32450,
      manifestWeightKg: 24000,
      weightVariancePercentage: 35.2,
      ocrConfidence: 99.2,
      shippingLine: 'HMM Ocean Line',
      bookingNo: 'EXP-889021',
      isoType: "40' HC",
      systemRecommendation: 'Weighbridge gross weight deviates by +35.2% (+8,450 KG) over declared VGM manifest. SOLAS VGM regulation compliance hold triggered.',
      comparisonFields: [
        {
          fieldName: 'Container ISO Serial',
          scannedOcrValue: 'HMMU 123456 7',
          manifestExpectedValue: 'HMMU 123456 7',
          hasDiscrepancy: false,
          confidenceScore: 99.2,
        },
        {
          fieldName: 'Gross Weight (Weighbridge)',
          scannedOcrValue: '32,450 KG',
          manifestExpectedValue: '24,000 KG',
          hasDiscrepancy: true,
        },
        {
          fieldName: 'VGM Threshold Tolerance',
          scannedOcrValue: '+35.2% Variance',
          manifestExpectedValue: 'Max ±5.0% Allowed',
          hasDiscrepancy: true,
        },
      ],
    },
    {
      id: 'alert-3',
      alertCode: 'ALT-MM-2025-0103',
      alertType: 'Seal Number Discrepancy',
      severity: 'Critical',
      status: 'Active',
      timestamp: '2025-05-17T09:05:00Z',
      gateLocation: 'GATE-03 (Express Gate)',
      truckNo: 'MH-12-PQ-9002',
      driverName: 'Sanjay Deshmukh',
      scannedContainerNo: 'MSKU 234567 8',
      expectedContainerNo: 'MSKU 234567 8',
      scannedSealNo: 'MSK-990142',
      expectedSealNo: 'MSK-990199',
      measuredWeightKg: 26500,
      manifestWeightKg: 26500,
      weightVariancePercentage: 0,
      ocrConfidence: 98.6,
      shippingLine: 'Maersk Line',
      bookingNo: 'EXP-332910',
      isoType: "40' HC",
      systemRecommendation: 'Line seal on rear right door does not match customs shipping bill manifest. Possible seal tampering or documentation error. Physical inspection mandatory.',
      comparisonFields: [
        {
          fieldName: 'Container ISO Serial',
          scannedOcrValue: 'MSKU 234567 8',
          manifestExpectedValue: 'MSKU 234567 8',
          hasDiscrepancy: false,
          confidenceScore: 98.6,
        },
        {
          fieldName: 'Line Bolt Seal No.',
          scannedOcrValue: 'MSK-990142',
          manifestExpectedValue: 'MSK-990199',
          hasDiscrepancy: true,
          confidenceScore: 96.8,
        },
        {
          fieldName: 'Customs Gate Pass',
          scannedOcrValue: 'Seal Mismatch Flagged',
          manifestExpectedValue: 'Verified',
          hasDiscrepancy: true,
        },
      ],
    },
    {
      id: 'alert-4',
      alertCode: 'ALT-MM-2025-0104',
      alertType: 'Damage / Structural Defect',
      severity: 'High',
      status: 'Active',
      timestamp: '2025-05-17T09:15:00Z',
      gateLocation: 'GATE-01 (Inbound Main)',
      truckNo: 'KA-01-MJ-1290',
      driverName: 'Venkatesh Rao',
      scannedContainerNo: 'TEMU 992011 8',
      expectedContainerNo: 'TEMU 992011 8',
      measuredWeightKg: 25600,
      manifestWeightKg: 25600,
      weightVariancePercentage: 0,
      ocrConfidence: 96.1,
      shippingLine: 'COSCO Shipping',
      bookingNo: 'RF-991048',
      isoType: "40' HC Reefer",
      detectedDamage: 'Top right corner casting dent and reefer unit cable sheath puncture detected by AI vision.',
      systemRecommendation: 'AI Vision camera detected structural puncture on upper front corner. Initiate EIR Damage Assessment before admitting to reefer rack.',
      comparisonFields: [
        {
          fieldName: 'Container ISO Serial',
          scannedOcrValue: 'TEMU 992011 8',
          manifestExpectedValue: 'TEMU 992011 8',
          hasDiscrepancy: false,
          confidenceScore: 96.1,
        },
        {
          fieldName: 'Visual Structural Condition',
          scannedOcrValue: 'Corner Casting Dent & Sheath Cut',
          manifestExpectedValue: 'Sound / Sound Cargo',
          hasDiscrepancy: true,
        },
      ],
    },
    {
      id: 'alert-5',
      alertCode: 'ALT-MM-2025-0105',
      alertType: 'Bay Stacking Conflict',
      severity: 'Medium',
      status: 'Resolved',
      timestamp: '2025-05-17T07:30:00Z',
      gateLocation: 'YARD-BLOCK-D',
      truckNo: 'MH-46-BA-5510',
      scannedContainerNo: 'CAIU 456789 2',
      expectedContainerNo: 'CAIU 456789 2',
      measuredWeightKg: 14200,
      manifestWeightKg: 14200,
      weightVariancePercentage: 0,
      ocrConfidence: 99.5,
      shippingLine: 'CMA CGM',
      bookingNo: 'YRD-104922',
      isoType: "20' GP",
      systemRecommendation: 'Assigned tier slot Block D/01-04 was occupied by holding chassis. Slot reallocated to Block D/02-05.',
      resolutionNotes: 'Operator verified slot clearance and updated TOS grid coordinates.',
      resolvedBy: 'Ramesh Kumar',
      resolvedAt: '2025-05-17T07:45:00Z',
      comparisonFields: [
        {
          fieldName: 'Container ISO Serial',
          scannedOcrValue: 'CAIU 456789 2',
          manifestExpectedValue: 'CAIU 456789 2',
          hasDiscrepancy: false,
        },
        {
          fieldName: 'Yard Slot Availability',
          scannedOcrValue: 'Reallocated Block D/02-05',
          manifestExpectedValue: 'Block D/01-04 (Occupied)',
          hasDiscrepancy: false,
        },
      ],
    },
  ];

  // Live Alerts Signal
  public readonly alerts = signal<ContainerMismatchAlert[]>(this.initialAlerts);

  // Active selected alert for comparison drawer / modal
  public readonly selectedAlert = signal<ContainerMismatchAlert | null>(this.initialAlerts[0]);

  // Modal open states
  public readonly isDetailModalOpen = signal<boolean>(false);

  // Filters
  public readonly severityFilter = signal<string>('All');
  public readonly typeFilter = signal<string>('All');
  public readonly statusFilter = signal<string>('All');
  public readonly searchQuery = signal<string>('');

  // Toast
  public readonly toastMessage = signal<string | null>(null);

  // Filtered Alerts
  public readonly filteredAlerts = computed<ContainerMismatchAlert[]>(() => {
    let list = this.alerts();
    const sev = this.severityFilter();
    const type = this.typeFilter();
    const status = this.statusFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (sev !== 'All') {
      list = list.filter((a) => a.severity.toLowerCase() === sev.toLowerCase());
    }

    if (type !== 'All') {
      list = list.filter((a) => a.alertType.toLowerCase() === type.toLowerCase());
    }

    if (status !== 'All') {
      list = list.filter((a) => a.status.toLowerCase() === status.toLowerCase());
    }

    if (q) {
      list = list.filter(
        (a) =>
          a.alertCode.toLowerCase().includes(q) ||
          a.scannedContainerNo.toLowerCase().includes(q) ||
          a.expectedContainerNo.toLowerCase().includes(q) ||
          a.truckNo.toLowerCase().includes(q) ||
          a.shippingLine.toLowerCase().includes(q) ||
          a.bookingNo.toLowerCase().includes(q) ||
          a.gateLocation.toLowerCase().includes(q)
      );
    }

    return list;
  });

  // KPI Metrics
  public readonly kpiMetrics = computed<AlertKpiMetrics>(() => {
    const list = this.alerts();
    const total = list.length;
    const critical = list.filter((a) => a.severity === 'Critical' && a.status !== 'Resolved').length;
    const mismatches = list.filter((a) => a.alertType === 'Container Number Mismatch' && a.status !== 'Resolved').length;
    const underReview = list.filter((a) => a.status === 'Under Review').length;
    const resolvedToday = list.filter((a) => a.status === 'Resolved').length;

    return {
      totalAlerts: total,
      totalAlertsTrend: '14% vs yesterday',
      criticalCount: critical,
      criticalTrend: '2 open critical',
      mismatchCount: mismatches,
      mismatchTrend: '3 OCR checks pending',
      underReviewCount: underReview,
      underReviewTrend: 'Active triage',
      resolvedTodayCount: resolvedToday,
      resolvedTodayTrend: 'Resolved successfully',
    };
  });

  // Actions
  public selectAlert(alert: ContainerMismatchAlert): void {
    this.selectedAlert.set(alert);
    this.isDetailModalOpen.set(true);
  }

  public openAlertModal(alert: ContainerMismatchAlert): void {
    this.selectedAlert.set(alert);
    this.isDetailModalOpen.set(true);
  }

  public closeAlertModal(): void {
    this.isDetailModalOpen.set(false);
  }

  public setSeverityFilter(sev: string): void {
    this.severityFilter.set(sev);
  }

  public setTypeFilter(type: string): void {
    this.typeFilter.set(type);
  }

  public setStatusFilter(status: string): void {
    this.statusFilter.set(status);
  }

  public setSearchQuery(q: string): void {
    this.searchQuery.set(q);
  }

  public resolveAlert(req: AlertResolutionRequest): void {
    const now = new Date().toISOString();
    let updatedStatus: AlertStatus = 'Resolved';
    let resolutionText = req.notes;

    if (req.action === 'OVERRIDE_VERIFY') {
      resolutionText = `Manual Override Verified: ${req.notes || 'Operator confirmed physical container markings match shipping invoice.'}`;
      updatedStatus = 'Resolved';
    } else if (req.action === 'DISPATCH_INSPECTION') {
      resolutionText = `Inspection Dispatched: ${req.notes || 'Customs exam bay work order triggered.'}`;
      updatedStatus = 'Under Review';
    } else if (req.action === 'RESCAN_GATE') {
      resolutionText = `Gate Re-scan Scheduled: ${req.notes || 'Optical camera re-calibration & second pass initiated.'}`;
      updatedStatus = 'Under Review';
    } else if (req.action === 'DISMISS') {
      resolutionText = `Alert Dismissed: ${req.notes || 'False positive confirmed by yard master.'}`;
      updatedStatus = 'Dismissed';
    }

    this.alerts.update((items) =>
      items.map((item) =>
        item.id === req.alertId
          ? {
              ...item,
              status: updatedStatus,
              resolutionNotes: resolutionText,
              resolvedBy: req.operatorName || 'Ramesh Kumar (Yard Operator)',
              resolvedAt: now,
            }
          : item
      )
    );

    const currentSelected = this.selectedAlert();
    if (currentSelected && currentSelected.id === req.alertId) {
      this.selectedAlert.set({
        ...currentSelected,
        status: updatedStatus,
        resolutionNotes: resolutionText,
        resolvedBy: req.operatorName || 'Ramesh Kumar',
        resolvedAt: now,
      });
    }

    this.showToast(`Alert ${req.alertId} updated: ${req.action.replace('_', ' ')}`);
    this.closeAlertModal();
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
