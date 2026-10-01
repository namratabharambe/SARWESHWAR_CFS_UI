import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  public readonly totalItems = input.required<number>();
  public readonly currentPage = input<number>(1);
  public readonly pageSize = input<number>(10);
  public readonly pageSizeOptions = input<number[]>([5, 10, 20, 50, 100]);
  public readonly itemLabel = input<string>('items');
  public readonly showPageSize = input<boolean>(true);

  public readonly pageChange = output<number>();
  public readonly pageSizeChange = output<number>();

  public readonly totalPages = computed<number>(() => {
    return Math.max(1, Math.ceil(this.totalItems() / this.pageSize()));
  });

  public readonly startIndex = computed<number>(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  public readonly endIndex = computed<number>(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  public readonly pages = computed<(number | '...')[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | '...')[] = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    let l: number | undefined;
    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  });

  public onSelectPage(page: number | '...'): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  public onPrevPage(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  public onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  public onPageSizeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const size = parseInt(target.value, 10);
    if (!isNaN(size)) {
      this.pageSizeChange.emit(size);
    }
  }
}
