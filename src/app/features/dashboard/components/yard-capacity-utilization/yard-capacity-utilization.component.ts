import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YardBlockRow, YardMetrics } from 'shared/types/dashboard/dashboard.interface';

export interface BlockBarData {
  name: string;
  percentage: number;
  colorClass: string;
}

@Component({
  selector: 'app-yard-capacity-utilization',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './yard-capacity-utilization.component.html',
  styleUrls: ['./yard-capacity-utilization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YardCapacityUtilizationComponent {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  public readonly yardRows = input<YardBlockRow[]>([]);
  public readonly metrics = input<YardMetrics>({
    totalBlocks: 9,
    totalRows: 9,
    teuCapacity: 1200,
    currentTeu: 816,
    utilizationPercentage: 68,
  });

  public readonly blockBars = computed<BlockBarData[]>(() => {
    return [
      { name: 'A', percentage: 68, colorClass: 'bar-blue' },
      { name: 'B', percentage: 72, colorClass: 'bar-teal' },
      { name: 'C', percentage: 59, colorClass: 'bar-blue' },
      { name: 'D', percentage: 47, colorClass: 'bar-blue' },
      { name: 'E', percentage: 64, colorClass: 'bar-teal' },
      { name: 'F', percentage: 52, colorClass: 'bar-blue' },
      { name: 'G', percentage: 78, colorClass: 'bar-teal' },
      { name: 'H', percentage: 41, colorClass: 'bar-blue' },
      { name: 'I', percentage: 55, colorClass: 'bar-teal' },
    ];
  });

  public readonly totalUtilization = computed<number>(() => {
    return this.metrics().utilizationPercentage || 68;
  });

  public readonly currentTeu = computed<number>(() => {
    return this.metrics().currentTeu || 816;
  });

  public readonly maxTeu = computed<number>(() => {
    return this.metrics().teuCapacity || 1200;
  });

  // Calculate SVG stroke-dasharray for donut gauge (circumference of r=24 is ~150.8)
  public readonly donutStrokeDash = computed<string>(() => {
    const circumference = 2 * Math.PI * 24; // ~150.796
    const pct = Math.max(0, Math.min(100, this.totalUtilization()));
    const filled = (pct / 100) * circumference;
    return `${filled.toFixed(1)} ${circumference.toFixed(1)}`;
  });

  public scrollLeft(): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollBy({ left: -140, behavior: 'smooth' });
    }
  }

  public scrollRight(): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollBy({ left: 140, behavior: 'smooth' });
    }
  }
}
