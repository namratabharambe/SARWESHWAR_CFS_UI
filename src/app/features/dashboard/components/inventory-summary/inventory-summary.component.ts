import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventorySummaryData } from 'shared/types/dashboard/dashboard.interface';

@Component({
  selector: 'app-inventory-summary',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './inventory-summary.component.html',
  styleUrls: ['./inventory-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySummaryComponent {
  public readonly data = input.required<InventorySummaryData>();

  public readonly gaugeRadius = 32;
  public readonly gaugeCircumference = 2 * Math.PI * this.gaugeRadius; // ≈ 201.06

  public readonly gaugeDashoffset = computed(() => {
    const pct = this.data().utilizationPercentage;
    return this.gaugeCircumference * (1 - pct / 100);
  });
}
