import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { GatePerformanceComponent } from './gate-performance.component';
import { DashboardService } from '../../services/dashboard.service';
import { GateActivityItem } from 'shared/types/dashboard/dashboard.interface';

const at = (minsAgo: number) => Date.now() - minsAgo * 60_000;
const item = (id: string, type: 'IN' | 'OUT', ts: number) =>
  ({ id, type, timestamp: ts, time: '', truckNo: '', containerNo: '', sizeType: '', direction: 'Import', ocrResult: '', ocrConfidence: 0, status: 'Verified' }) as GateActivityItem;

describe('GatePerformanceComponent', () => {
  it('buckets movements by hour and averages gate-in to gate-out time', () => {
    TestBed.configureTestingModule({
      imports: [GatePerformanceComponent],
      providers: [{ provide: DashboardService, useValue: { avgOcrConfidence: () => 90 } }],
    });
    const fixture = TestBed.createComponent(GatePerformanceComponent);
    fixture.componentRef.setInput('activities', [
      item('v1-in', 'IN', at(60)),
      item('v1-out', 'OUT', at(20)),
      item('v2', 'IN', at(5)),
      item('old', 'IN', at(60 * 24)), // outside the 8-hour window
    ]);
    const c = fixture.componentInstance;

    expect(c.buckets().length).toBe(8);
    expect(c.totals()).toEqual({ inCount: 2, outCount: 1, all: 3 });
    expect(c.turnaround()).toBe(40);
    expect(c.yMax()).toBeGreaterThanOrEqual(2);
  });
});
