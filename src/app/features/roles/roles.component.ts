import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminRepository } from 'core/data/admin.repository';
import { Role } from 'core/models/admin.models';
import { RouterLink } from '@angular/router';
import { ModalComponent } from 'shared/components/molecules/modal/modal.component';
import { FormFieldComponent, SelectOption } from 'shared/components/molecules/form-field/form-field.component';
import { PaginationComponent } from 'shared/components/molecules/pagination/pagination.component';
import { FocusInvalidFieldDirective } from 'shared/directives';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ModalComponent,
    FormFieldComponent,
    PaginationComponent,
    FocusInvalidFieldDirective,
    TranslatePipe,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesComponent {
  public readonly repo = inject(AdminRepository);
  public readonly editing = signal<Role | null | undefined>(undefined);

  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  public readonly paginatedRoles = computed(() => {
    const list = this.repo.roles();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  public readonly breadcrumbs = [
    { label: 'Home', url: '/dashboard' },
    { label: 'Admin', url: '/admin' },
    { label: 'Roles' },
  ];

  public readonly levelOptions: SelectOption[] = [
    { label: 'Client', value: 'Client' },
    { label: 'Site', value: 'Site' },
  ];

  public readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl('', { nonNullable: true, validators: Validators.required }),
    level: new FormControl<'Client' | 'Site'>('Site', { nonNullable: true }),
  });

  public setPage(page: number): void {
    this.currentPage.set(page);
  }

  public setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  public open(x?: Role): void {
    this.editing.set(x ?? null);
    this.form.reset(x ?? { name: '', description: '', level: 'Site' });
  }

  public setScope(level: 'Client' | 'Site'): void {
    this.form.controls.level.setValue(level);
  }

  public save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.repo.saveRole({
      id: this.editing()?.id ?? crypto.randomUUID(),
      ...this.form.getRawValue(),
    });
    this.editing.set(undefined);
  }
}
