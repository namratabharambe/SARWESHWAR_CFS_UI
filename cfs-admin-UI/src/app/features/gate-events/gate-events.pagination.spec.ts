import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { GateEventsComponent } from './gate-events.component';
import { GateEventService } from 'shared/services/gate-event.service';

/** Fake server: 40 visits, 25 completed (gate in + gate out), 15 still in yard. Pages by visit. */
function visit(i: number, out: boolean) {
  const t = Date.UTC(2026, 9, 20, 0, 0) + i * 60_000;
  const ev = (type: string, at: number) => ({
    sourceEventId: `${type}-${i}`,
    eventType: type,
    capturedAt: new Date(at).toISOString(),
    detectedContainerNumber: `MSCU${String(1000000 + i)}`,
    detectedContainerConfidence: 0.97,
    detectedContainerSize: i % 2 ? '40' : '20',
    images: [],
  });
  return {
    visitId: `V-${i}`,
    containerNumber: `MSCU${String(1000000 + i)}`,
    containerConfidence: 0.97,
    containerSize: i % 2 ? '40' : '20',
    truckNumber: `MH12AB${1000 + i}`,
    status: out ? 'DEPARTED' : 'IN_YARD',
    createdAt: new Date(t).toISOString(),
    events: out ? [ev('GATE_IN', t), ev('GATE_OUT', t + 30 * 60_000)] : [ev('GATE_IN', t)],
  };
}
const ALL = Array.from({ length: 40 }, (_, i) => visit(i, i < 25));

function setup(cap = 1000) {
  TestBed.configureTestingModule({
    imports: [GateEventsComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const svc = TestBed.inject(GateEventService);
  vi.spyOn(svc, 'getGateCounts').mockReturnValue(of({ totalGateIn: 40, totalGateOut: 25, totalCount: 40 } as any));
  vi.spyOn(svc, 'getVisits').mockImplementation((o: any) => {
    const page = o?.page ?? 1;
    const size = Math.min(o?.pageSize ?? 25, cap);
    const items = ALL.slice((page - 1) * size, page * size);
    return of({ items, page, pageSize: size, totalCount: ALL.length, totalPages: Math.ceil(ALL.length / size) } as any);
  });
  const fixture = TestBed.createComponent(GateEventsComponent);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('GateEventsComponent rows per page', () => {
  const cases: Array<['all' | 'in' | 'out', number]> = [
    ['all', 65],
    ['in', 40],
    ['out', 25],
  ];

  for (const [mode, total] of cases) {
    it(`${mode}: every page shows exactly "rows per page" rows and pages add up to ${total}`, () => {
      const c = setup();
      c.setMode(mode);
      for (const size of [10, 25]) {
        c.onPageSizeChange(size);
        const pages = Math.ceil(total / size);
        let seen = 0;
        for (let p = 1; p <= pages; p++) {
          c.setPage(p);
          const rows = c.paginatedEvents().length;
          expect(rows).toBe(p < pages ? size : total - size * (pages - 1));
          seen += rows;
        }
        expect(seen).toBe(total);
        expect(c.totalPages()).toBe(pages);
      }
    });
  }

  it('keeps rows per page when switching tabs and when a filter is applied', () => {
    const c = setup();
    c.onPageSizeChange(25);
    c.setMode('in');
    expect(c.pageSize()).toBe(25);
    expect(c.paginatedEvents().length).toBe(25);
    const forty = c.filteredEvents().filter((e) => e.size === '40').length;
    c.onFilterApply({ values: { size: '40' }, sort: 'date-desc' });
    expect(forty).toBeGreaterThan(0);
    expect(c.pageSize()).toBe(25);
    expect(c.paginatedEvents().length).toBe(Math.min(25, forty));
    expect(c.paginatedEvents().every((e) => e.size === '40' && e.direction === 'IN')).toBe(true);
    expect(c.totalPages()).toBe(1);
  });

  it('loads every visit when the server caps page size', () => {
    const c = setup(15);
    c.setMode('all');
    expect(c.filteredEvents().length).toBe(65);
    const ids = c.filteredEvents().map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
