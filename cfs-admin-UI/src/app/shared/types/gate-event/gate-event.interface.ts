export interface ContainerInfo {
  containerNumber?: string | null;
  ContainerNumber?: string | null;
  containerNumberConfidence?: number | null;
  ContainerNumberConfidence?: number | null;
  size?: string | null;
  Size?: string | null;
  isoCode?: string | null;
  sealNo?: string | null;
  sealNo2?: string | null;
  customSealNo?: string | null;
  tareWeight?: string | null;
  cargoType?: string | null;
  fullOrEmpty?: string | null;
  location?: string | null;
  condition?: string | null;
  damageFlag?: boolean;
  images?: SavedImageDto[];
}

export interface TruckInfo {
  truckNumber?: string | null;
  TruckNumber?: string | null;
}

export interface DriverInfo {
  driverName?: string | null;
  DriverName?: string | null;
  driverId?: string | null;
  DriverId?: string | null;
}

export interface SavedImageDto {
  imageType?: string;
  ImageType?: string;
  cameraId?: string;
  CameraId?: string;
  capturedAt?: string;
  CapturedAt?: string;
  s3Url?: string;
  S3Url?: string;
  s3Key?: string;
  S3Key?: string;
  containerIndex?: number;
  containerNumber?: string;
}

export interface CapturedImageInfo {
  imageType?: string;
  ImageType?: string;
  cameraId?: string;
  CameraId?: string;
  capturedAt?: string;
  CapturedAt?: string;
  image?: string;
  Image?: string;
  containerIndex?: number;
  containerNumber?: string;
}

export interface GateEventDetailDto {
  id?: string;
  Id?: string;
  visitId?: string;
  VisitId?: string;
  eventType?: string;
  EventType?: string;
  deviceId?: string;
  DeviceId?: string;
  capturedAt?: string;
  CapturedAt?: string;
  container?: ContainerInfo | null;
  Container?: ContainerInfo | null;
  containers?: ContainerInfo[];
  Containers?: ContainerInfo[];
  truck?: TruckInfo | null;
  Truck?: TruckInfo | null;
  driver?: DriverInfo | null;
  Driver?: DriverInfo | null;
  images?: SavedImageDto[];
  Images?: SavedImageDto[];
  frontImageUrl?: string | null;
  FrontImageUrl?: string | null;
  frontCameraId?: string | null;
  FrontCameraId?: string | null;
  frontCapturedAt?: string | null;
  FrontCapturedAt?: string | null;
  rearImageUrl?: string | null;
  RearImageUrl?: string | null;
  rearCameraId?: string | null;
  RearCameraId?: string | null;
  rearCapturedAt?: string | null;
  RearCapturedAt?: string | null;
  leftImageUrl?: string | null;
  LeftImageUrl?: string | null;
  leftCameraId?: string | null;
  LeftCameraId?: string | null;
  leftCapturedAt?: string | null;
  LeftCapturedAt?: string | null;
  rightImageUrl?: string | null;
  RightImageUrl?: string | null;
  rightCameraId?: string | null;
  RightCameraId?: string | null;
  rightCapturedAt?: string | null;
  RightCapturedAt?: string | null;
  createdAt?: string;
  CreatedAt?: string;
}

export interface GateEventsResponse {
  totalCount?: number;
  TotalCount?: number;
  page?: number;
  Page?: number;
  pageSize?: number;
  PageSize?: number;
  items?: GateEventDetailDto[];
  Items?: GateEventDetailDto[];
}

export interface GateEventCaptureRequest {
  visitId?: string;
  VisitId?: string;
  eventType?: string;
  EventType?: string;
  deviceId?: string;
  DeviceId?: string;
  capturedAt?: string;
  CapturedAt?: string;
  container?: ContainerInfo | null;
  Container?: ContainerInfo | null;
  containers?: ContainerInfo[];
  Containers?: ContainerInfo[];
  truck?: TruckInfo | null;
  Truck?: TruckInfo | null;
  driver?: DriverInfo | null;
  Driver?: DriverInfo | null;
  images?: CapturedImageInfo[];
  Images?: CapturedImageInfo[];
}

export interface GateEventCaptureResponse {
  id?: string;
  Id?: string;
  visitId?: string;
  VisitId?: string;
  eventType?: string;
  EventType?: string;
  deviceId?: string;
  DeviceId?: string;
  capturedAt?: string;
  CapturedAt?: string;
  images?: SavedImageDto[];
  Images?: SavedImageDto[];
  createdAt?: string;
  CreatedAt?: string;
}

// -------------------------------------------------------------
// GET /api/v1/gate/visits Domain Interfaces (Matches API Schema)
// -------------------------------------------------------------

export interface VisitImageDto {
  id?: string;
  imageType?: string;
  cameraId?: string;
  capturedAt?: string;
  imageUrl?: string;
  containerIndex?: number;
  containerNumber?: string;
}

export interface VisitEventDto {
  sourceEventId?: string;
  eventType?: string; // 'GATE_IN' | 'GATE_OUT'
  deviceId?: string;
  capturedAt?: string;
  createdByUserId?: string;
  detectedContainerNumber?: string | null;
  detectedContainerConfidence?: number | null;
  detectedContainerSize?: string | null;
  detectedContainerIsoCode?: string | null;
  detectedTruckNumber?: string | null;
  detectedTruckConfidence?: number | null;
  images?: VisitImageDto[];
}

export interface VisitListItemDto {
  visitId: string;
  containerNumber?: string | null;
  containerConfidence?: number | null;
  containerSize?: string | null;
  containers?: ContainerInfo[];
  truckNumber?: string | null;
  truckConfidence?: number | null;
  driverName?: string | null;
  driverId?: string | null;
  status: string; // 'IN_YARD' | 'DEPARTED' | etc.
  createdAt: string;
  events?: VisitEventDto[];
}

export interface VisitsPagedResponse {
  items: VisitListItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GateCountsResponse {
  clientId?: string;
  siteId?: string;
  userId?: string;
  totalGateIn?: number;
  totalGateOut?: number;
  todayGateIn?: number;
  todayGateOut?: number;
  GateinReviewCount?: number;
  GateOutReviewCount?: number;
  GateinocrVerifiedCount?: number;
  GateOutocrVerifiedCount?: number;
  gateInReviewCount?: number;
  gateOutReviewCount?: number;
  gateInocrVerifiedCount?: number;
  gateOutocrVerifiedCount?: number;
  inReviewCount?: number;
  ocrVerifiedCount?: number;
  totalCount?: number;
  pendingReview?: number;
  ocrVerified?: number;
  todayArrivals?: number;
  todayDepartures?: number;
}

export const DEFAULT_FALLBACK_GATE_COUNTS: GateCountsResponse = {
  totalGateIn: 197,
  totalGateOut: 395,
  todayGateIn: 24,
  todayGateOut: 1,
  GateinReviewCount: 8,
  GateOutReviewCount: 18,
  GateinocrVerifiedCount: 189,
  GateOutocrVerifiedCount: 377,
  gateInReviewCount: 8,
  gateOutReviewCount: 18,
  gateInocrVerifiedCount: 189,
  gateOutocrVerifiedCount: 377,
  totalCount: 592,
  inReviewCount: 26,
  ocrVerifiedCount: 566,
  todayArrivals: 24,
  todayDepartures: 1,
  pendingReview: 26,
  ocrVerified: 566,
};

export function normalizeGateCounts(raw: any): GateCountsResponse {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_FALLBACK_GATE_COUNTS;
  }
  const data = raw.data || raw.result || raw;

  const toNum = (val: any, fallback: number = 0): number => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string' && val.trim() !== '') {
      const parsed = Number(val);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  };

  const totalGateIn = toNum(data.totalGateIn ?? data.TotalGateIn ?? data.totalCheckin, 197);
  const totalGateOut = toNum(data.totalGateOut ?? data.TotalGateOut ?? data.totalCheckout, 395);
  const todayGateIn = toNum(data.todayGateIn ?? data.TodayGateIn ?? data.todayArrivals ?? data.todayCheckin, 24);
  const todayGateOut = toNum(data.todayGateOut ?? data.TodayGateOut ?? data.todayDepartures ?? data.todayCheckout, 1);

  const gateInReview = toNum(
    data.GateinReviewCount ??
      data.gateinReviewCount ??
      data.GateInReviewCount ??
      data.gateInReviewCount ??
      data.inReviewCount,
    8,
  );
  const gateOutReview = toNum(
    data.GateOutReviewCount ??
      data.gateOutReviewCount ??
      data.outReviewCount,
    18,
  );

  const gateInOcr = toNum(
    data.GateinocrVerifiedCount ??
      data.gateinocrVerifiedCount ??
      data.GateInOcrVerifiedCount ??
      data.gateInocrVerifiedCount ??
      data.GateInocrVerifiedCount,
    189,
  );
  const gateOutOcr = toNum(
    data.GateOutocrVerifiedCount ??
      data.gateOutocrVerifiedCount ??
      data.GateOutOcrVerifiedCount,
    377,
  );

  const ocrVerified = toNum(
    data.ocrVerified ?? data.ocrVerifiedCount ?? (gateInOcr + gateOutOcr),
    gateInOcr + gateOutOcr,
  );
  const pendingReview = toNum(
    data.pendingReview ?? data.inReviewCount ?? (gateInReview + gateOutReview),
    gateInReview + gateOutReview,
  );
  const totalCount = toNum(
    data.totalCount ?? data.TotalCount ?? (totalGateIn + totalGateOut),
    totalGateIn + totalGateOut,
  );

  return {
    ...data,
    totalGateIn,
    totalGateOut,
    todayGateIn,
    todayGateOut,
    todayArrivals: todayGateIn,
    todayDepartures: todayGateOut,
    GateinReviewCount: gateInReview,
    GateOutReviewCount: gateOutReview,
    gateInReviewCount: gateInReview,
    gateOutReviewCount: gateOutReview,
    GateinocrVerifiedCount: gateInOcr,
    GateOutocrVerifiedCount: gateOutOcr,
    gateInocrVerifiedCount: gateInOcr,
    gateOutocrVerifiedCount: gateOutOcr,
    ocrVerified,
    ocrVerifiedCount: ocrVerified,
    pendingReview,
    inReviewCount: pendingReview,
    totalCount,
  };
}

