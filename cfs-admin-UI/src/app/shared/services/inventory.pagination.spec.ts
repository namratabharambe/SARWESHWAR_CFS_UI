import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { InventoryService } from './inventory.service';
import { GateEventService } from './gate-event.service';

/** Fake server: 40 visits, 25 departed (gate in + gate out), 15 still in yard. */
function visit(i: number, out: boolean) {
  const t = Date.UTC(2026, 9, 20, 0, 0) + i * 60_000;
  const ev = (type: string, at: number) => ({
    sourceEventId: `${type}-${i}`,
    eventType: type,
    capturedAt: new Date(at).toISOString(),
    detectedContainerNumber: `MSCU${1000000 + i}`,
    detectedContainerSize: i % 2 ? '40' : '20',
    images: [],
  });
  return {
    visitId: `V-${i}`,
    containerNumber: `MSCU${1000000 + i}`,
    containerSize: i % 2 ? '40' : '20',
    status: out ? 'DEPARTED' : 'IN_YARD',
    createdAt: new Date(t).toISOString(),
    events: out ? [ev('GATE_IN', t), ev('GATE_OUT', t + 1_800_000)] : [ev('GATE_IN', t)],
  };
}
const ALL = Array.from({ length: 40 }, (_, i) => visit(i, i < 25));

function setup(cap = 1000) {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
  const gate = TestBed.inject(GateEventService);
  vi.spyOn(gate, 'getGateCounts').mockReturnValue(of({ totalGateIn: 40, totalGateOut: 25, totalCount: 40 } as any));
  vi.spyOn(gate, 'getVisits').mockImplementation((o: any) => {
    const page = o?.page ?? 1;
    const size = Math.min(o?.pageSize ?? 25, cap);
    return of({ items: ALL.slice((page - 1) * size, page * size), page, pageSize: size, totalCount: ALL.length } as any);
  });
  return TestBed.inject(InventoryService);
}

/** Walks every page and checks each holds exactly pageSize rows (last page: the remainder). */
function checkPages(s: InventoryService) {
  const total = s.filteredContainers().length;
  const size = s.pageSize();
  const pages = Math.max(1, Math.ceil(total / size));
  expect(s.totalPages()).toBe(pages);
  let seen = 0;
  for (let p = 1; p <= pages; p++) {
    s.setPage(p);
    const rows = s.paginatedContainers().length;
    expect(rows).toBe(p < pages ? size : total - size * (pages - 1));
    seen += rows;
  }
  expect(seen).toBe(total);
}

describe('InventoryService rows per page', () => {
  it('stays exact across All / Gate In / Gate Out and page sizes', () => {
    const s = setup();
    for (const kpi of ['All', 'Total Gate In', 'Total Gate Out']) {
      s.selectedKpiFilter.set(kpi);
      for (const size of [10, 25]) {
        s.setPageSize(size);
        checkPages(s);
      }
    }
  });

  it('does not show an empty page after switching tab from a later page', () => {
    const s = setup();
    s.setPageSize(10);
    s.setPage(s.totalPages());
    s.selectKpiCard('Total Gate Out');
    expect(s.paginatedContainers().length).toBeGreaterThan(0);
  });

  it('stays exact when filters are applied', () => {
    const s = setup();
    s.setPageSize(10);
    s.sizeFilter.set(s.containers()[1].sizeType);
    checkPages(s);
  });

  it('loads every visit when the server caps page size, with no duplicate rows', () => {
    const s = setup(15);
    const ids = s.containers().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(s.containers().map((c) => c.containerNo)).size).toBe(40);
  });
});
