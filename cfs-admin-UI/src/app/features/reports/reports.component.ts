import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from 'shared/services/report.service';
import { ReportCategory } from 'shared/types/report/report.interface';
import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';
import { DatePickerComponent } from 'shared/components/molecules/date-picker/date-picker.component';
import { matchesDateFilter, parseAnyDate } from 'shared/utils/date-filter.util';

export type GateOperationKpiFilter = 'ALL' | 'GATE_IN' | 'GATE_OUT' | 'NON_ERP_GATE_IN' | 'NON_ERP_GATE_OUT' | 'EXCEPTION';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, DatePickerComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  public readonly reportService = inject(ReportService);

  public ngOnInit(): void {
    this.reportService.loadGateOperationsData();
  }

  // Active KPI Filter (like Tasks KPI Cards)
  public readonly selectedKpiFilter = signal<GateOperationKpiFilter>('ALL');

  // Search and Date Filters matching Gate Events
  public readonly searchQuery = signal<string>('');
  public readonly dateFilter = signal<string>('');

  // Row selection for selective export (matching inventory page)
  public readonly selectedIds = signal<Set<string>>(new Set());
  public readonly selectedCount = computed<number>(() => this.selectedIds().size);

  // Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  public readonly isAllSelected = computed<boolean>(() => {
    const current = this.paginatedGateOps();
    if (!current.length) return false;
    const selected = this.selectedIds();
    return current.every((r) => selected.has(r.id));
  });

  public toggleSelectAll(): void {
    const current = this.paginatedGateOps();
    const selected = new Set(this.selectedIds());
    if (this.isAllSelected()) {
      current.forEach((r) => selected.delete(r.id));
    } else {
      current.forEach((r) => selected.add(r.id));
    }
    this.selectedIds.set(selected);
  }

  public toggleSelect(id: string): void {
    const selected = new Set(this.selectedIds());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedIds.set(selected);
  }

  public isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  // Dynamic Gate Operation KPI counts from database (Non-ERP is 0 as there is no data in ERP)
  public readonly gateOpKpis = computed(() => {
    const rows = this.reportService.gateOperationsData();
    const counts = this.reportService.gateCounts();

    const gateIn = typeof counts?.totalGateIn === 'number'
      ? counts.totalGateIn
      : rows.filter((r) => r.direction === 'IN' && !r.isNonErp).length;

    const gateOut = typeof counts?.totalGateOut === 'number'
      ? counts.totalGateOut
      : rows.filter((r) => r.direction === 'OUT' && !r.isNonErp).length;

    const nonErpGateIn = 0; // In ERP there is no data so show 0
    const nonErpGateOut = 0; // In ERP there is no data so show 0

    const exceptionFromApi = counts?.pendingReview ?? counts?.inReviewCount;
    const exception = typeof exceptionFromApi === 'number'
      ? exceptionFromApi
      : rows.filter((r) => r.ocrStatus === 'Exception' || r.status === 'Held').length;

    return {
      gateIn,
      gateOut,
      nonErpGateIn,
      nonErpGateOut,
      exception,
    };
  });

  // Filtered rows applying search query, active KPI card filter, and date filter
  public readonly filteredGateOpsWithKpi = computed(() => {
    let rows = this.reportService.filteredGateRows();
    const kpi = this.selectedKpiFilter();
    if (kpi === 'GATE_IN') {
      rows = rows.filter((r) => r.direction === 'IN' && !r.isNonErp);
    } else if (kpi === 'GATE_OUT') {
      rows = rows.filter((r) => r.direction === 'OUT' && !r.isNonErp);
    } else if (kpi === 'NON_ERP_GATE_IN') {
      rows = rows.filter((r) => r.direction === 'IN' && r.isNonErp);
    } else if (kpi === 'NON_ERP_GATE_OUT') {
      rows = rows.filter((r) => r.direction === 'OUT' && r.isNonErp);
    } else if (kpi === 'EXCEPTION') {
      rows = rows.filter((r) => r.ocrStatus === 'Exception' || r.status === 'Held');
    }

    const df = this.dateFilter();
    if (df && df.trim()) {
      rows = rows.filter((r) => matchesDateFilter(r.rawDate || r.timestamp, df));
    }

    return rows;
  });

  public readonly paginatedGateOps = computed(() => {
    const list = this.filteredGateOpsWithKpi();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public readonly totalItems = computed(() => {
    return this.filteredGateOpsWithKpi().length;
  });

  // Single category button: Gate Operation
  public readonly categories: {
    id: ReportCategory;
    transKey: string;
    label: string;
    icon: string;
  }[] = [
    {
      id: 'gate-operations',
      transKey: 'REPORTS.GATE_OPERATIONS',
      label: 'Gate Operation',
      icon: 'sensor_occupied',
    },
  ];

  public readonly datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'monthToDate', label: 'Month to Date' },
  ] as const;

  public readonly selectedPresetLabel = computed(() => {
    const currentPreset = this.reportService.filter().preset;
    const found = this.datePresets.find((dp) => dp.value === currentPreset);
    return found ? found.label : 'Today';
  });

  public setCategory(cat: ReportCategory): void {
    this.reportService.setCategory(cat);
    this.currentPage.set(1);
  }

  public selectKpiFilter(filter: GateOperationKpiFilter): void {
    if (this.selectedKpiFilter() === filter) {
      this.selectedKpiFilter.set('ALL');
    } else {
      this.selectedKpiFilter.set(filter);
    }
    this.currentPage.set(1);
  }

  public setDatePreset(preset: (typeof this.datePresets)[number]['value']): void {
    this.reportService.setDatePreset(preset);
    this.currentPage.set(1);
  }

  public onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.reportService.setSearchQuery(value);
    this.currentPage.set(1);
  }

  public onDateFilterChange(val: string): void {
    this.dateFilter.set(val);
    this.currentPage.set(1);

    if (!val) {
      this.reportService.loadGateOperationsData();
      return;
    }

    const parsed = parseAnyDate(val);
    if (parsed) {
      const year = parsed.getFullYear();
      const month = parsed.getMonth();
      const day = parsed.getDate();
      const start = new Date(year, month, day, 0, 0, 0).toISOString();
      const end = new Date(year, month, day, 23, 59, 59, 999).toISOString();
      this.reportService.loadGateOperationsData(undefined, undefined, start, end);
    } else {
      this.reportService.loadGateOperationsData();
    }
  }

  public setPage(page: number): void {
    this.currentPage.set(page);
  }

  public setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  public exportData(): void {
    const allFiltered = this.filteredGateOpsWithKpi();
    const selected = this.selectedIds();
    const data = selected.size > 0
      ? allFiltered.filter((r) => selected.has(r.id))
      : allFiltered;

    if (!data.length) {
      this.reportService.showToast('No records available to export.');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Visit No,Timestamp,Direction,Truck No,Driver Name,Container No,OCR Status,Dwell Time,Status']
        .concat(
          data.map(
            (r) =>
              `"${r.visitNo}","${r.timestamp}","${r.direction}","${r.truckNo}","${r.driverName}","${r.containerNo}","${r.ocrStatus}","${r.dwellTime || '-'}","${r.status}"`,
          ),
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gate-operations-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.reportService.showToast(
      selected.size > 0
        ? `Exported ${selected.size} selected record(s) to CSV.`
        : `Exported ${data.length} gate operation records to CSV.`
    );
  }

  public exportCsv(): void {
    this.exportData();
  }

  public exportXls(): void {
    this.reportService.exportCurrentReportToXls();
  }
}
