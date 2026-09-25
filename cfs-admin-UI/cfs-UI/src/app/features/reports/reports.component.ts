import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from 'shared/services/report.service';
import { ReportCategory } from 'shared/types/report/report.interface';

import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  public readonly reportService = inject(ReportService);

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

  public setCategory(cat: ReportCategory): void {
    this.reportService.setCategory(cat);
  }

  public setDatePreset(preset: (typeof this.datePresets)[number]['value']): void {
    this.reportService.setDatePreset(preset);
  }

  public exportCsv(): void {
    this.reportService.exportCurrentReportToCsv();
  }

  public exportXls(): void {
    this.reportService.exportCurrentReportToXls();
  }
}
