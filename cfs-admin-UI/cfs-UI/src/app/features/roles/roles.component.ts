import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminRepository } from 'core/data/admin.repository';
import { Role } from 'core/models/admin.models';
import { PageHeaderComponent } from 'shared/components/organisms/page-header/page-header.component';
import { ModalComponent } from 'shared/components/molecules/modal/modal.component';
import { FormFieldComponent, SelectOption } from 'shared/components/molecules/form-field/form-field.component';
import { FocusInvalidFieldDirective } from 'shared/directives';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    ModalComponent,
    FormFieldComponent,
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

  public readonly breadcrumbs = [
    { label: 'Home', url: '/dashboard' },
    { label: 'Admin', url: '/roles' },
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
