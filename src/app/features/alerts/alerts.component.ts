import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertService } from 'shared/services/alert.service';
import { AlertResolutionRequest, ContainerMismatchAlert } from 'shared/types/alert/alert.interface';
import { MismatchDetailModalComponent } from './components/mismatch-detail-modal/mismatch-detail-modal.component';
import { DropdownComponent } from 'shared/components/molecules/dropdown/dropdown.component';

import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MismatchDetailModalComponent, DropdownComponent, TranslatePipe],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsComponent {
  public readonly alertService = inject(AlertService);

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
  }
}
