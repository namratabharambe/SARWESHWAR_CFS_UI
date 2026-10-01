import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YardBlockRow, YardContainerStatus, YardMetrics } from 'shared/types/dashboard/dashboard.interface';

import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-yard-snapshot',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  templateUrl: './yard-snapshot.component.html',
  styleUrls: ['./yard-snapshot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YardSnapshotComponent {
  public readonly rows = input.required<YardBlockRow[]>();
  public readonly metrics = input.required<YardMetrics>();

  public readonly bayColumns = ['01', '02', '03', '04', '05', '06', '08'];

  public readonly legendItems: { label: string; status: YardContainerStatus; colorClass: string }[] = [
    { label: 'Import', status: 'import', colorClass: 'bg-blue-600' },
    { label: 'Export', status: 'export', colorClass: 'bg-emerald-500' },
    { label: 'Empty', status: 'empty', colorClass: 'bg-sky-400' },
    { label: 'Hazard', status: 'hazard', colorClass: 'bg-amber-500' },
    { label: 'Maintenance', status: 'maintenance', colorClass: 'bg-rose-500' },
    { label: 'Vacant', status: 'vacant', colorClass: 'bg-gray-200 dark:bg-gray-700' },
  ];

  public getSlotColorClass(status: YardContainerStatus): string {
    switch (status) {
      case 'import':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'export':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'empty':
        return 'bg-sky-400 hover:bg-sky-500';
      case 'hazard':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'maintenance':
        return 'bg-rose-500 hover:bg-rose-600';
      case 'vacant':
      default:
        return 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';
    }
  }
}
