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
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
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
