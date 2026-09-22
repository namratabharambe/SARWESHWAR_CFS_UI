import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GateActivityItem } from 'shared/types/dashboard/dashboard.interface';

@Component({
  selector: 'app-recent-gate-activity',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-gate-activity.component.html',
  styleUrls: ['./recent-gate-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentGateActivityComponent {
  public readonly activities = input.required<GateActivityItem[]>();
  public readonly totalEntries = input<number>(25);
  public readonly currentPage = input<number>(1);
  public readonly pageSize = input<number>(5);

  public readonly pageChange = output<number>();

  public readonly pages = [1, 2, 3, 4, 5];

  public readonly showingStart = computed(() => {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  public readonly showingEnd = computed(() => {
    const end = this.currentPage() * this.pageSize();
    return end > this.totalEntries() ? this.totalEntries() : end;
  });

  public onSelectPage(page: number): void {
    if (page >= 1 && page <= this.pages.length) {
      this.pageChange.emit(page);
    }
  }

  public onNextPage(): void {
    if (this.currentPage() < this.pages.length) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
