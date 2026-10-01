import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from 'shared/services/alert.service';
import { AlertResolutionRequest, ContainerMismatchAlert } from 'shared/types/alert/alert.interface';
import { MismatchDetailModalComponent } from './components/mismatch-detail-modal/mismatch-detail-modal.component';
import { DropdownComponent } from 'shared/components/molecules/dropdown/dropdown.component';
import { TranslatePipe } from 'shared/pipes';

import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MismatchDetailModalComponent, DropdownComponent, PaginationComponent, TranslatePipe],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsComponent implements OnInit {
  public readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);

  public readonly isFilterVisible = signal<boolean>(false);

  // Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  public readonly paginatedAlerts = computed<ContainerMismatchAlert[]>(() => {
    const list = this.alertService.filteredAlerts();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public setPage(page: number): void {
    this.currentPage.set(page);
  }

  public setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  public readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.alertService.severityFilter() !== 'All') count++;
    if (this.alertService.typeFilter() !== 'All') count++;
    if (this.alertService.statusFilter() !== 'All') count++;
    if (this.alertService.searchQuery().trim()) count++;
    return count;
  });

  public ngOnInit(): void {
    const alertId = this.route.snapshot.queryParamMap.get('alertId');
    if (alertId) {
      const match = this.alertService.alerts().find((a) => a.id === alertId || a.alertCode === alertId);
      if (match) {
        this.alertService.selectAlert(match);
      }
    }
  }

  public readonly severityOptions = [
    { value: 'All', label: 'All Severities' },
    { value: 'Critical', label: 'Critical' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Warning', label: 'Warning' },
  ];

  public readonly typeOptions = [
    { value: 'All', label: 'All Alert Types' },
    { value: 'Container Number Mismatch', label: 'Container No Mismatch' },
    { value: 'Seal Number Discrepancy', label: 'Seal Discrepancy' },
    { value: 'Weight Variance Exceeded', label: 'Weight Variance' },
    { value: 'Damage / Structural Defect', label: 'Damage Defect' },
    { value: 'Bay Stacking Conflict', label: 'Bay Stacking Conflict' },
  ];

  public readonly statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Resolved', label: 'Resolved' },
  ];

  public onSeverityChange(sev: string): void {
    this.alertService.setSeverityFilter(sev as any);
    this.currentPage.set(1);
  }

  public onTypeChange(type: string): void {
    this.alertService.setTypeFilter(type as any);
    this.currentPage.set(1);
  }

  public onStatusChange(status: string): void {
    this.alertService.setStatusFilter(status as any);
    this.currentPage.set(1);
  }

  public onSearchChange(q: string): void {
    this.alertService.setSearchQuery(q);
    this.currentPage.set(1);
  }

  public openInspectModal(alert: ContainerMismatchAlert): void {
    this.alertService.openAlertModal(alert);
  }

  public handleResolution(req: AlertResolutionRequest): void {
    this.alertService.resolveAlert(req);
  }

  public refreshAlerts(): void {
    this.alertService.showToast('Container mismatch alerts refreshed.');
  }

  public resetFilters(): void {
    this.alertService.setSeverityFilter('All');
    this.alertService.setTypeFilter('All');
    this.alertService.setStatusFilter('All');
    this.alertService.setSearchQuery('');
    this.currentPage.set(1);
  }
}
