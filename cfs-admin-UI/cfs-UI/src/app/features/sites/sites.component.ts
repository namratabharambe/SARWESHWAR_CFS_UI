import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'core/auth/auth.service';
import { AdminRepository } from 'core/data/admin.repository';
import { Site } from 'core/models/admin.models';
import { PageHeaderComponent } from 'shared/components/organisms/page-header/page-header.component';
import { StatusBadgeComponent } from 'shared/components/atoms/status-badge/status-badge.component';
import { ModalComponent } from 'shared/components/molecules/modal/modal.component';
import { FormFieldComponent, SelectOption } from 'shared/components/molecules/form-field/form-field.component';
import { DropdownComponent } from 'shared/components/molecules/dropdown/dropdown.component';
import { FocusInvalidFieldDirective, HighlightTextDirective } from 'shared/directives';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-sites',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    ModalComponent,
    FormFieldComponent,
    DropdownComponent,
    FocusInvalidFieldDirective,
    HighlightTextDirective,
    TranslatePipe,
  ],
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SitesComponent {
  public readonly repo = inject(AdminRepository);
  public readonly auth = inject(AuthService);

  public readonly searchQuery = signal<string>('');
  public readonly statusFilter = signal<'ALL' | 'Active' | 'Inactive'>('ALL');
  public readonly statusFilterOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];
  public readonly editingSite = signal<Site | null | undefined>(undefined);
  public readonly isSaving = signal<boolean>(false);
  public readonly saveError = signal<string>('');

  public readonly breadcrumbs = [
    { label: 'Home', url: '/dashboard' },
    { label: 'Admin', url: '/sites' },
    { label: 'Site' },
  ];

  constructor() {
    this.repo.loadClients();
    this.repo.loadSites();
  }

  public readonly form = new FormGroup({
    clientId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  public readonly clientOptions = computed<SelectOption[]>(() =>
    this.repo.clients().map((c) => ({
      label: c.clientName ?? c.name,
      value: c.id,
    })),
  );

  public readonly filteredSites = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.repo.sites().filter((site) => {
      const siteName = (site.name ?? '').toLowerCase();
      const siteCode = (site.code ?? '').toLowerCase();
      const clientName = (this.getClientName(site.clientId) ?? '').toLowerCase();
      const matchesQuery = !query || siteName.includes(query) || siteCode.includes(query) || clientName.includes(query);

      const siteStatus = site.status ?? (site.active === false ? 'Inactive' : 'Active');
      const matchesStatus = status === 'ALL' || siteStatus.toLowerCase() === status.toLowerCase();

      return matchesQuery && matchesStatus;
    });
  });

  public getClientName(clientId: string): string {
    const client = this.repo.clients().find((c) => c.id === clientId);
    return client ? (client.clientName ?? client.name) : '—';
  }

  public getInitials(name: string): string {
    if (!name) return 'ST';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  public openModal(site?: Site): void {
    if (this.repo.clients().length === 0) {
      this.repo.loadClients();
    }
    this.saveError.set('');
    this.editingSite.set(site ?? null);
    const defaultClientId =
      this.auth.selectedClientId() ||
      this.auth.getActiveClientId() ||
      (this.repo.clients().length > 0 ? this.repo.clients()[0].id : '');

    this.form.reset({
      clientId: site?.clientId ?? defaultClientId,
      name: site?.name ?? '',
      code: site?.code ?? '',
    });
  }

  public closeModal(): void {
    this.editingSite.set(undefined);
    this.saveError.set('');
    this.form.reset();
  }

  public refresh(): void {
    this.repo.loadSites();
  }

  public saveSite(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { clientId, name, code } = this.form.getRawValue();
    const targetClientId = (clientId || this.auth.selectedClientId() || this.auth.getActiveClientId()).trim();

    if (!targetClientId) {
      this.saveError.set('Please select a Client before saving the site.');
      return;
    }

    const current = this.editingSite();
    this.isSaving.set(true);
    this.saveError.set('');

    this.repo
      .saveSite({
        id: current?.id,
        clientId: targetClientId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.repo.loadSites(targetClientId);
        },
        error: (err) => {
          this.isSaving.set(false);
          const msg = this.repo.extractErrorMessage(
            err,
            'Failed to save site. Please verify the client and site code.',
          );
          this.saveError.set(msg);
        },
      });
  }

  public deleteSite(site: Site): void {
    const siteName = site.name ?? 'this site';
    if (confirm(`Are you sure you want to deactivate or remove site "${siteName}"?`)) {
      this.repo.patchSiteActive(site.id, false).subscribe({
        next: () => this.repo.loadSites(),
      });
    }
  }
}
