import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DonutChartData, DonutChartSegment } from 'shared/types/dashboard/dashboard.interface';

interface CalculatedArcSegment extends DonutChartSegment {
  strokeDasharray: string;
  strokeDashoffset: number;
}

@Component({
  selector: 'app-status-donut-chart',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './status-donut-chart.component.html',
  styleUrls: ['./status-donut-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDonutChartComponent {
  public readonly chartData = input.required<DonutChartData>();

  public readonly radius = 38;
  public readonly circumference = 2 * Math.PI * this.radius; // ≈ 238.76

  public readonly calculatedSegments = computed<CalculatedArcSegment[]>(() => {
    const segments = this.chartData().segments;
    let cumulativePercentage = 0;

    return segments.map((seg) => {
      const dashLength = (seg.percentage / 100) * this.circumference;
      const spaceLength = this.circumference - dashLength;
      const offset = cumulativePercentage === 0 ? 0 : -(cumulativePercentage / 100) * this.circumference;

      cumulativePercentage += seg.percentage;

      return {
        ...seg,
        strokeDasharray: `${dashLength} ${spaceLength}`,
        strokeDashoffset: offset,
      };
    });
  });
}
