import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from 'shared/services/report.service';
import { ReportCategory } from 'shared/types/report/report.interface';
import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';

export type GateOperationKpiFilter = 'ALL' | 'GATE_IN' | 'GATE_OUT' | 'NON_ERP_GATE_IN' | 'NON_ERP_GATE_OUT' | 'EXCEPTION';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  public readonly reportService = inject(ReportService);

  public ngOnInit(): void {
    this.reportService.loadGateOperationsData();
  }

  public readonly isDateDropdownOpen = signal<boolean>(false);
  public readonly isExportDropdownOpen = signal<boolean>(false);
  public readonly isMoreMenuOpen = signal<boolean>(false);

  // Active KPI Filter (like Tasks KPI Cards)
  public readonly selectedKpiFilter = signal<GateOperationKpiFilter>('ALL');

  // Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  // Dynamic Gate Operation KPI counts
  public readonly gateOpKpis = computed(() => {
    const rows = this.reportService.gateOperationsData();
    const gateIn = rows.filter((r) => r.direction === 'IN' && !r.isNonErp).length;
    const gateOut = rows.filter((r) => r.direction === 'OUT' && !r.isNonErp).length;
    const nonErpGateIn = rows.filter((r) => r.direction === 'IN' && r.isNonErp).length;
    const nonErpGateOut = rows.filter((r) => r.direction === 'OUT' && r.isNonErp).length;
    const exception = rows.filter((r) => r.ocrStatus === 'Exception' || r.status === 'Held').length;

    return {
      gateIn,
      gateOut,
      nonErpGateIn,
      nonErpGateOut,
      exception,
    };
  });

  // Filtered rows applying both search query and active KPI card filter
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
    this.reportService.setSearchQuery(value);
    this.currentPage.set(1);
  }

  public setPage(page: number): void {
    this.currentPage.set(page);
  }

  public setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  public exportCsv(): void {
    this.reportService.exportCurrentReportToCsv();
  }

  public exportXls(): void {
    this.reportService.exportCurrentReportToXls();
  }
}
