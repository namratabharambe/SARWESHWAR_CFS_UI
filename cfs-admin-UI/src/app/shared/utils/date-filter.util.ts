/**
 * Shared utility for robust date filtering across Gate Events, Inventory, and Dashboard.
 * Supports ISO strings, DD MMM YYYY, DD-MM-YYYY, DD/MM/YYYY, timestamps, and localized date formats.
 */

const SHORT_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function parseAnyDate(val: string | number | Date | undefined | null): Date | null {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  const trimmed = String(val).trim();
  if (!trimmed) return null;

  // 1. Try standard JS date parsing
  const standard = new Date(trimmed);
  if (!isNaN(standard.getTime()) && !/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(trimmed)) {
    return standard;
  }

  // 2. Try 'DD MMM YYYY' (e.g. '12 Oct 2026', '12 Oct 2026, 10:30 AM')
  const dmyAlpha = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (dmyAlpha) {
    const day = parseInt(dmyAlpha[1], 10);
    const mStr = dmyAlpha[2].slice(0, 3).toLowerCase();
    const mIdx = SHORT_MONTHS.findIndex((sm) => sm === mStr);
    const year = parseInt(dmyAlpha[3], 10);
    const hour = dmyAlpha[4] ? parseInt(dmyAlpha[4], 10) : 0;
    const min = dmyAlpha[5] ? parseInt(dmyAlpha[5], 10) : 0;
    if (mIdx >= 0) {
      return new Date(year, mIdx, day, hour, min);
    }
  }

  // 3. Try 'DD-MM-YYYY' or 'DD/MM/YYYY' (e.g. '12-10-2026')
  const dmyNumeric = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (dmyNumeric) {
    const day = parseInt(dmyNumeric[1], 10);
    const month = parseInt(dmyNumeric[2], 10) - 1;
    const year = parseInt(dmyNumeric[3], 10);
    const hour = dmyNumeric[4] ? parseInt(dmyNumeric[4], 10) : 0;
    const min = dmyNumeric[5] ? parseInt(dmyNumeric[5], 10) : 0;
    return new Date(year, month, day, hour, min);
  }

  // 4. Try 'YYYY-MM-DD'
  const isoNumeric = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoNumeric) {
    const year = parseInt(isoNumeric[1], 10);
    const month = parseInt(isoNumeric[2], 10) - 1;
    const day = parseInt(isoNumeric[3], 10);
    return new Date(year, month, day);
  }

  return !isNaN(standard.getTime()) ? standard : null;
}

export function isSameCalendarDay(
  source: string | number | Date | undefined | null,
  target: string | number | Date | undefined | null,
): boolean {
  if (!source || !target) return false;
  const d1 = parseAnyDate(source);
  const d2 = parseAnyDate(target);
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isCreatedToday(source: string | number | Date | undefined | null): boolean {
  if (!source) return false;
  const d = parseAnyDate(source);
  if (!d) return false;
  const now = new Date();
  const isLocalToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const isUtcToday =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  return isLocalToday || isUtcToday;
}

export function isVisitDeparture(visit: any): boolean {
  if (!visit) return false;
  const eventsList: any[] = Array.isArray(visit.events)
    ? visit.events
    : (Array.isArray(visit.Events) ? visit.Events : []);
  const visitDirection = String(visit.direction ?? visit.Direction ?? '').toUpperCase();
  const visitEventType = String(visit.eventType ?? visit.EventType ?? '').toUpperCase();
  const visitStatus = String(visit.status ?? visit.Status ?? '').toUpperCase();

  const hasOutEvent = eventsList.some((e: any) => {
    const t = String(e.eventType ?? e.EventType ?? '').toUpperCase();
    return t.includes('OUT') || t.includes('EXIT');
  });
  const isOutStatus = visitStatus.includes('DEPART') || visitStatus.includes('EXIT') || visitStatus.includes('OUT');
  const isOutType = visitEventType.includes('OUT') || visitDirection.includes('OUT');

  if (eventsList.length > 0) {
    return hasOutEvent || isOutType;
  }
  return hasOutEvent || isOutStatus || isOutType || Boolean(visit.departedAt || visit.DepartedAt);
}

export function isVisitArrival(visit: any): boolean {
  if (!visit) return false;
  const eventsList: any[] = Array.isArray(visit.events)
    ? visit.events
    : (Array.isArray(visit.Events) ? visit.Events : []);
  const visitDirection = String(visit.direction ?? visit.Direction ?? '').toUpperCase();
  const visitEventType = String(visit.eventType ?? visit.EventType ?? '').toUpperCase();
  const visitStatus = String(visit.status ?? visit.Status ?? '').toUpperCase();

  const hasInEvent = eventsList.some((e: any) => {
    const t = String(e.eventType ?? e.EventType ?? '').toUpperCase();
    return t.includes('IN') || t.includes('ENTER');
  });
  const isInType = visitEventType.includes('IN') || visitDirection.includes('IN');
  const isInStatus = visitStatus.includes('YARD') || visitStatus.includes('ARRIV');

  if (eventsList.length > 0) {
    return hasInEvent || isInType;
  }
  return Boolean(hasInEvent || isInType || isInStatus || (visit.arrivedAt && !visit.departedAt));
}

export function isVisitArrivalToday(visit: any): boolean {
  if (!visit) return false;
  const eventsList: any[] = Array.isArray(visit.events)
    ? visit.events
    : (Array.isArray(visit.Events) ? visit.Events : []);
  const inEvent = eventsList.find((e: any) => {
    const t = String(e.eventType ?? e.EventType ?? '').toUpperCase();
    return t.includes('IN') || t.includes('ENTER');
  });

  if (inEvent) {
    const inTime = inEvent.capturedAt ?? inEvent.CapturedAt;
    return isCreatedToday(inTime);
  }

  // If there are gate events present, but none is an IN event, it is NOT an arrival today
  if (eventsList.length > 0) {
    return false;
  }

  // Fallback for visits without events list: only if it has arrivedAt and has not departed
  const hasDeparted = visit.departedAt || visit.DepartedAt;
  if (hasDeparted) return false;

  const arrivedAt = visit.arrivedAt ?? visit.ArrivedAt ?? visit.createdAt ?? visit.CreatedAt;
  return isCreatedToday(arrivedAt);
}

export function isVisitDepartureToday(visit: any): boolean {
  if (!visit) return false;
  const eventsList: any[] = Array.isArray(visit.events)
    ? visit.events
    : (Array.isArray(visit.Events) ? visit.Events : []);
  const outEvent = eventsList.find((e: any) => {
    const t = String(e.eventType ?? e.EventType ?? '').toUpperCase();
    return t.includes('OUT') || t.includes('EXIT');
  });

  if (outEvent) {
    const outTime = outEvent.capturedAt ?? outEvent.CapturedAt;
    return isCreatedToday(outTime);
  }

  // If there are gate events present, but none is an OUT event, it is NOT a departure today
  if (eventsList.length > 0) {
    return false;
  }

  // Fallback for visits without events: only if departedAt exists
  const departedAt = visit.departedAt ?? visit.DepartedAt;
  if (!departedAt) return false;
  return isCreatedToday(departedAt);
}

export function matchesDateFilter(
  itemDateSource: string | number | Date | undefined | null,
  dateFilterStr: string | undefined | null,
): boolean {
  if (!dateFilterStr || !dateFilterStr.trim()) return true;
  const filterDate = parseAnyDate(dateFilterStr);
  if (!filterDate) return true;

  if (itemDateSource) {
    const itemDate = parseAnyDate(itemDateSource);
    if (itemDate) {
      if (
        itemDate.getFullYear() === filterDate.getFullYear() &&
        itemDate.getMonth() === filterDate.getMonth() &&
        itemDate.getDate() === filterDate.getDate()
      ) {
        return true;
      }
    }
    // Fallback: substring matching on text representations
    const str = String(itemDateSource).toLowerCase();
    const filterLower = dateFilterStr.trim().toLowerCase();
    if (str.includes(filterLower)) {
      return true;
    }
  }

  return false;
}

/** Drops repeated visits (same visitId) that can appear when several API pages are merged. */
export function uniqueVisits<T>(visits: T[]): T[] {
  const seen = new Set<string>();
  return (visits ?? []).filter((v: any) => {
    const id = v?.visitId ?? v?.VisitId;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
