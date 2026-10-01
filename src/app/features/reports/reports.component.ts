import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from 'shared/services/report.service';
import { ReportCategory } from 'shared/types/report/report.interface';
import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  public readonly reportService = inject(ReportService);

  public readonly isDateDropdownOpen = signal<boolean>(false);
  public readonly isExportDropdownOpen = signal<boolean>(false);
  public readonly isMoreMenuOpen = signal<boolean>(false);

  // Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  public readonly paginatedGateOps = computed(() => {
    const list = this.reportService.filteredGateRows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public readonly paginatedMismatches = computed(() => {
    const list = this.reportService.filteredMismatchRows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public readonly paginatedYardOccupancy = computed(() => {
    const list = this.reportService.filteredYardRows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public readonly paginatedEquipment = computed(() => {
    const list = this.reportService.filteredEquipmentRows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public readonly paginatedCustoms = computed(() => {
    const list = this.reportService.filteredCustomsRows();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public readonly totalItems = computed(() => {
    switch (this.reportService.selectedCategory()) {
      case 'gate-operations':
        return this.reportService.filteredGateRows().length;
      case 'container-mismatch':
        return this.reportService.filteredMismatchRows().length;
      case 'yard-occupancy':
        return this.reportService.filteredYardRows().length;
      case 'equipment-productivity':
        return this.reportService.filteredEquipmentRows().length;
      case 'customs-billing':
        return this.reportService.filteredCustomsRows().length;
      default:
        return 0;
    }
  });

  public readonly categories: {
    id: ReportCategory;
    transKey: string;
    label: string;
    icon: string;
    countBadge?: string;
  }[] = [
    {
      id: 'gate-operations',
      transKey: 'REPORTS.GATE_OPERATIONS',
      label: 'Gate Operations & Turnaround',
      icon: 'sensor_occupied',
      countBadge: '7',
    },
    {
      id: 'container-mismatch',
      transKey: 'REPORTS.CONTAINER_MISMATCH',
      label: 'Container Mismatch & OCR Audit',
      icon: 'gpp_maybe',
      countBadge: '5',
    },
    {
      id: 'yard-occupancy',
      transKey: 'REPORTS.YARD_OCCUPANCY',
      label: 'Yard Occupancy & Dwell Time',
      icon: 'grid_view',
      countBadge: '5',
    },
    {
      id: 'equipment-productivity',
      transKey: 'REPORTS.EQUIPMENT_PRODUCTIVITY',
      label: 'Equipment & Operator Productivity',
      icon: 'precision_manufacturing',
      countBadge: '5',
    },
    {
      id: 'customs-billing',
      transKey: 'REPORTS.CUSTOMS_BILLING',
      label: 'Customs & Billing Dossier',
      icon: 'receipt_long',
      countBadge: '5',
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

