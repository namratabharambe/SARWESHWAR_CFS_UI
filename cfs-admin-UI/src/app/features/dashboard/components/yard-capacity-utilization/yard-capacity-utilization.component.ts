import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { YardMetrics } from 'shared/types/dashboard/dashboard.interface';

export interface BlockUsage {
  name: string;
  type: string;
  capacity: number;
  occupied: number;
  percentage: number;
  color: string;
}

export interface DonutSegment {
  name: string;
  color: string;
  track: string; // dasharray for the block's full capacity arc
  fill: string; // dasharray for its occupied part
  offset: number;
}

const R = 40;
const CIRC = 2 * Math.PI * R;
const GAP = 1.6; // visual gap between block arcs

// Block layout with each block's share of total yard capacity.
// ponytail: the API has no per-block data yet, so the live total is split by capacity share; swap in real block counts when the API provides them.
const BLOCKS = [
  { name: 'Block A & B', type: 'Import / Export', share: 500 / 1200, color: '#10b981' },
  { name: 'Block C', type: 'Empty Depot', share: 320 / 1200, color: '#3b82f6' },
  { name: 'Block D', type: 'General Yard', share: 240 / 1200, color: '#06b6d4' },
  { name: 'Block E & F', type: 'Reefer / Staging', share: 140 / 1200, color: '#f97316' },
];

@Component({
  selector: 'app-yard-capacity-utilization',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './yard-capacity-utilization.component.html',
  styleUrls: ['./yard-capacity-utilization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YardCapacityUtilizationComponent {
  public readonly metrics = input<YardMetrics>({
    totalBlocks: 0,
    totalRows: 0,
    teuCapacity: 1200,
    currentTeu: 0,
    utilizationPercentage: 0,
  });

  public readonly maxTeu = computed<number>(() => this.metrics().teuCapacity || 1200);
  public readonly currentTeu = computed<number>(() => Math.min(this.metrics().currentTeu || 0, this.maxTeu()));
  public readonly availableTeu = computed<number>(() => this.maxTeu() - this.currentTeu());
  public readonly totalUtilization = computed<number>(() => Math.round((this.currentTeu() / this.maxTeu()) * 100));

  public readonly blocks = computed<BlockUsage[]>(() => {
    const max = this.maxTeu();
    const used = this.currentTeu();
    let capLeft = max;
    let usedLeft = used;
    return BLOCKS.map((b, i) => {
      const last = i === BLOCKS.length - 1;
      // Last block takes the rounding remainder so the rows always sum to the totals.
      const capacity = last ? capLeft : Math.round(max * b.share);
      const occupied = last ? usedLeft : Math.round(used * b.share);
      capLeft -= capacity;
      usedLeft -= occupied;
      return {
        name: b.name,
        type: b.type,
        capacity,
        occupied,
        percentage: capacity ? Math.round((occupied / capacity) * 100) : 0,
        color: b.color,
      };
    });
  });

  /** One arc per block sized by capacity; the solid part inside it is the occupied share. */
  public readonly segments = computed<DonutSegment[]>(() => {
    const max = this.maxTeu();
    let start = 0;
    return this.blocks().map((b) => {
      const len = (b.capacity / max) * CIRC;
      const visible = Math.max(len - GAP, 0);
      const filled = b.capacity ? visible * (b.occupied / b.capacity) : 0;
      const seg = {
        name: b.name,
        color: b.color,
        track: `${visible.toFixed(2)} ${CIRC.toFixed(2)}`,
        fill: `${filled.toFixed(2)} ${CIRC.toFixed(2)}`,
        offset: -start,
      };
      start += len;
      return seg;
    });
  });
}
