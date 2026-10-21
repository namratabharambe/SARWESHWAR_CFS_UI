import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { GateActivityItem } from 'shared/types/dashboard/dashboard.interface';
import { DashboardService } from '../../services/dashboard.service';

export interface HourBucket {
  label: string;
  inCount: number;
  outCount: number;
  x: number; // 0..100 (% of plot width)
}

const HOURS = 8;
const HOUR_MS = 3_600_000;

/** Builds an SVG path for points in a 0..100 x 0..100 box (y grows downward). */
function linePath(points: Array<[number, number]>): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

@Component({
  selector: 'app-gate-performance',
  standalone: true,
  templateUrl: './gate-performance.component.html',
  styleUrls: ['./gate-performance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GatePerformanceComponent {
  private readonly dashboard = inject(DashboardService);

  public readonly activities = input<GateActivityItem[]>([]);
  public readonly ocr = this.dashboard.avgOcrConfidence;

  private readonly stamped = computed(() => this.activities().filter((a) => typeof a.timestamp === 'number' && a.timestamp > 0));

  /** Last 8 hours ending now; if nothing happened in that span, end at the latest recorded movement instead. */
  private readonly windowEnd = computed<number>(() => {
    const now = Date.now();
    const latest = Math.max(0, ...this.stamped().map((a) => a.timestamp!));
    const end = latest && latest < now - HOURS * HOUR_MS ? latest : now;
    const d = new Date(end);
    d.setMinutes(0, 0, 0);
    return d.getTime();
  });

  public readonly buckets = computed<HourBucket[]>(() => {
    const end = this.windowEnd();
    const start = end - (HOURS - 1) * HOUR_MS;
    const out: HourBucket[] = Array.from({ length: HOURS }, (_, i) => ({
      label: new Date(start + i * HOUR_MS).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      inCount: 0,
      outCount: 0,
      x: (i / (HOURS - 1)) * 100,
    }));
    for (const a of this.stamped()) {
      const i = Math.floor((a.timestamp! - start) / HOUR_MS);
      if (i < 0 || i >= HOURS) continue;
      if (a.type === 'IN') out[i].inCount++;
      else out[i].outCount++;
    }
    return out;
  });

  public readonly totals = computed(() => {
    const b = this.buckets();
    const inCount = b.reduce((s, x) => s + x.inCount, 0);
    const outCount = b.reduce((s, x) => s + x.outCount, 0);
    return { inCount, outCount, all: inCount + outCount };
  });

  /** Y-axis top: the peak hour rounded up to an even number, at least 2. */
  public readonly yMax = computed<number>(() => {
    const peak = Math.max(...this.buckets().map((b) => Math.max(b.inCount, b.outCount)));
    return Math.max(2, Math.ceil(peak / 2) * 2);
  });

  public readonly yTicks = computed<number[]>(() => [this.yMax(), this.yMax() / 2, 0]);

  public y(v: number): number {
    return 100 - (v / this.yMax()) * 100;
  }

  public readonly inLine = computed(() => linePath(this.buckets().map((b) => [b.x, this.y(b.inCount)])));
  public readonly outLine = computed(() => linePath(this.buckets().map((b) => [b.x, this.y(b.outCount)])));
  public readonly inArea = computed(() => `${this.inLine()} L100,100 L0,100 Z`);

  /** Average minutes between gate-in and gate-out for visits that have both. */
  public readonly turnaround = computed<number | null>(() => {
    const ins = new Map<string, number>();
    const outs = new Map<string, number>();
    for (const a of this.stamped()) {
      const m = /^(.*)-(in|out)$/.exec(a.id);
      if (!m) continue;
      (m[2] === 'in' ? ins : outs).set(m[1], a.timestamp!);
    }
    const mins: number[] = [];
    ins.forEach((t, id) => {
      const o = outs.get(id);
      if (o && o > t) mins.push((o - t) / 60_000);
    });
    return mins.length ? Math.round(mins.reduce((s, v) => s + v, 0) / mins.length) : null;
  });

  public readonly hasData = computed<boolean>(() => this.totals().all > 0);
}
