export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Warning';

export type AlertType =
  | 'Container Number Mismatch'
  | 'Seal Number Discrepancy'
  | 'Weight Variance Exceeded'
  | 'Damage / Structural Defect'
  | 'Unauthorized Gate Entry'
  | 'Bay Stacking Conflict';

export type AlertStatus = 'Active' | 'Under Review' | 'Resolved' | 'Dismissed';

export interface MismatchFieldComparison {
  fieldName: string;
  scannedOcrValue: string;
  manifestExpectedValue: string;
  hasDiscrepancy: boolean;
  confidenceScore?: number;
  highlightIndices?: number[];
}

export interface ContainerMismatchAlert {
  id: string;
  alertCode: string;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  gateLocation: string;
  truckNo: string;
  driverName?: string;
  driverLicense?: string;
  scannedContainerNo: string;
  expectedContainerNo: string;
  scannedSealNo?: string;
  expectedSealNo?: string;
  measuredWeightKg?: number;
  manifestWeightKg?: number;
  weightVariancePercentage?: number;
  ocrConfidence: number;
  cameraPhotoUrl?: string;
  shippingLine: string;
  bookingNo: string;
  isoType: string;
  detectedDamage?: string;
  systemRecommendation: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  comparisonFields: MismatchFieldComparison[];
}

export interface AlertKpiMetrics {
  totalAlerts: number;
  totalAlertsTrend: string;
  criticalCount: number;
  criticalTrend: string;
  mismatchCount: number;
  mismatchTrend: string;
  underReviewCount: number;
  underReviewTrend: string;
  resolvedTodayCount: number;
  resolvedTodayTrend: string;
}

export interface AlertResolutionRequest {
  alertId: string;
  action: 'OVERRIDE_VERIFY' | 'DISPATCH_INSPECTION' | 'RESCAN_GATE' | 'CONFIRM_RESOLVED' | 'DISMISS';
  notes: string;
  operatorName: string;
  correctedContainerNo?: string;
}
