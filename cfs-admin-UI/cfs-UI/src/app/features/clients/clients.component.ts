import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminRepository } from 'core/data/admin.repository';
import { Client } from 'core/models/admin.models';
import { PageHeaderComponent } from 'shared/components/organisms/page-header/page-header.component';
import { StatusBadgeComponent } from 'shared/components/atoms/status-badge/status-badge.component';
import { ModalComponent } from 'shared/components/molecules/modal/modal.component';
import { FormFieldComponent } from 'shared/components/molecules/form-field/form-field.component';
import { AvatarComponent } from 'shared/components/atoms/avatar/avatar.component';
import { FocusInvalidFieldDirective, HighlightTextDirective } from 'shared/directives';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AvatarComponent,
    ModalComponent,
    FormFieldComponent,
    FocusInvalidFieldDirective,
    HighlightTextDirective,
    TranslatePipe,
  ],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent {
  public readonly repo = inject(AdminRepository);

  public readonly searchQuery = signal<string>('');
  public readonly statusFilter = signal<'ALL' | 'Active' | 'Inactive'>('ALL');
  public readonly editingClient = signal<Client | null | undefined>(undefined);
  public readonly isSaving = signal<boolean>(false);
  public readonly saveError = signal<string>('');

  // Status Activation / Deactivation Modal State
  public readonly statusModalClient = signal<Client | null>(null);
  public readonly targetStatus = signal<boolean>(true);
  public readonly isUpdatingStatus = signal<boolean>(false);
  public readonly statusError = signal<string>('');

  public readonly breadcrumbs = [
    { label: 'Home', url: '/dashboard' },
    { label: 'Admin', url: '/clients' },
    { label: 'Client' },
  ];

  public readonly form = new FormGroup({
    clientName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  public readonly filteredClients = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.repo.clients().filter((client) => {
      const name = (client.clientName ?? client.name ?? '').toLowerCase();
      const matchesQuery = !query || name.includes(query);

      const clientStatus = client.status ?? (client.active === false ? 'Inactive' : 'Active');
      const matchesStatus = status === 'ALL' || clientStatus.toLowerCase() === status.toLowerCase();

      return matchesQuery && matchesStatus;
    });
  });

  public getInitials(name: string): string {
    if (!name) return 'CL';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  public openModal(client?: Client): void {
    this.saveError.set('');
    this.editingClient.set(client ?? null);
    this.form.reset({
      clientName: client ? (client.clientName ?? client.name ?? '') : '',
    });
  }

  public closeModal(): void {
    this.editingClient.set(undefined);
    this.saveError.set('');
    this.form.reset();
  }

  public refresh(): void {
    this.repo.loadClients();
  }

  public saveClient(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { clientName } = this.form.getRawValue();
    const current = this.editingClient();
    this.isSaving.set(true);
    this.saveError.set('');

    this.repo
      .saveClient({
        id: current?.id,
        clientName: clientName.trim(),
        name: clientName.trim(),
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.repo.loadClients();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.saveError.set(this.repo.extractErrorMessage(err, 'Failed to save client organization.'));
        },
      });
  }

  public openStatusModal(client: Client): void {
    this.statusError.set('');
    const isCurrentlyActive = client.status === 'Active' || client.active === true;
    this.targetStatus.set(!isCurrentlyActive);
    this.statusModalClient.set(client);
  }

  public closeStatusModal(): void {
    this.statusModalClient.set(null);
    this.statusError.set('');
  }

  public confirmStatusChange(): void {
    const client = this.statusModalClient();
    if (!client) return;

    const newActive = this.targetStatus();
    this.isUpdatingStatus.set(true);
    this.statusError.set('');

    this.repo.patchClientActive(client.id, newActive).subscribe({
      next: () => {
        this.isUpdatingStatus.set(false);
        this.closeStatusModal();
        this.repo.loadClients();
      },
      error: (err) => {
        this.isUpdatingStatus.set(false);
        this.statusError.set(
          this.repo.extractErrorMessage(
            err,
            `Failed to ${newActive ? 'activate' : 'deactivate'} client. Please try again.`,
          ),
        );
      },
    });
  }

  public deleteClient(client: Client): void {
    this.openStatusModal(client);
  }
}
