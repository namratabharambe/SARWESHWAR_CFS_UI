import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminRepository } from 'core/data/admin.repository';
import { AuthService } from 'core/auth/auth.service';
import { User, Site, Role } from 'core/models/admin.models';
import { PageHeaderComponent } from 'shared/components/organisms/page-header/page-header.component';
import { StatusBadgeComponent } from 'shared/components/atoms/status-badge/status-badge.component';
import { AvatarComponent } from 'shared/components/atoms/avatar/avatar.component';
import { ModalComponent } from 'shared/components/molecules/modal/modal.component';
import { FormFieldComponent, SelectOption } from 'shared/components/molecules/form-field/form-field.component';
import { DropdownComponent } from 'shared/components/molecules/dropdown/dropdown.component';
import { FocusInvalidFieldDirective, HighlightTextDirective } from 'shared/directives';
import { TranslatePipe } from 'shared/pipes';

export interface RoleDetail {
  id: string;
  name: string;
  description: string;
}

export interface SiteRoleItem {
  siteId: string;
  role: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AvatarComponent,
    ModalComponent,
    FormFieldComponent,
    DropdownComponent,
    FocusInvalidFieldDirective,
    HighlightTextDirective,
    TranslatePipe,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit {
  private readonly repo = inject(AdminRepository);
  public readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly searchQuery = signal('');
  public readonly statusFilter = signal<'ALL' | 'Active' | 'Inactive'>('ALL');
  public readonly statusFilterOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];
  public readonly roleFilter = signal<string>('ALL');
  public readonly editingUser = signal<User | null | undefined>(undefined);
  public readonly isSaving = signal(false);
  public readonly showPassword = signal(false);
  public readonly modalSites = signal<Site[]>([]);
  public readonly siteFilterQuery = signal('');

  // Per-site role mapping state for add/edit modal
  public readonly siteRoles = signal<SiteRoleItem[]>([]);
  public readonly globalDefaultRole = signal<string>('Operator');
  public readonly modalError = signal<string>('');

  public readonly breadcrumbs = [
    { label: 'Home', url: '/dashboard' },
    { label: 'Admin', url: '/users' },
    { label: 'User' },
  ];

  public readonly form = new FormGroup({
    userName: new FormControl('', {
      nonNullable: true,
    }),
    password: new FormControl('', {
      nonNullable: true,
    }),
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    mobileNumber: new FormControl('', {
      nonNullable: true,
    }),
    clientId: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<'Active' | 'Inactive'>('Active', {
      nonNullable: true,
    }),
  });

  public readonly clientOptions = computed<SelectOption[]>(() => [
    { label: 'No Client (Global / Enterprise)', value: '' },
    ...this.repo.clients().map((c) => ({
      label: c.clientName ?? c.name,
      value: c.id,
    })),
  ]);

  public readonly availableSites = computed<Site[]>(() => {
    return this.modalSites().length > 0 ? this.modalSites() : this.repo.sites();
  });

  public readonly filteredAvailableSites = computed<Site[]>(() => {
    const q = this.siteFilterQuery().trim().toLowerCase();
    const sites = this.availableSites();
    if (!q) return sites;
    return sites.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q),
    );
  });

  public readonly availableRoles = computed<RoleDetail[]>(() => {
    const defaultDescriptions: Record<string, string> = {
      SystemAdmin: 'Full system configuration, security rules, and global access.',
      Administrator: 'Administrative management, client reports, and site operations.',
      Supervisor: 'Oversees daily terminal shifts, gate traffic, and auditing.',
      Operator: 'Executes standard gate transactions, movements, and entries.',
      'Gate Operator': 'Dedicated gate lane entry & exit checkpoint processing.',
    };

    const repoRoles = this.repo.roles();
    if (repoRoles && repoRoles.length > 0) {
      return repoRoles.map((r) => ({
        id: r.id || r.name,
        name: r.name,
        description: r.description || defaultDescriptions[r.name] || 'Operational role for terminal workflows.',
      }));
    }

    return [
      { id: 'SystemAdmin', name: 'SystemAdmin', description: defaultDescriptions['SystemAdmin'] },
      { id: 'Administrator', name: 'Administrator', description: defaultDescriptions['Administrator'] },
      { id: 'Supervisor', name: 'Supervisor', description: defaultDescriptions['Supervisor'] },
      { id: 'Operator', name: 'Operator', description: defaultDescriptions['Operator'] },
      { id: 'Gate Operator', name: 'Gate Operator', description: defaultDescriptions['Gate Operator'] },
    ];
  });

  public readonly roleOptions = computed<SelectOption[]>(() => {
    return this.availableRoles().map((r) => ({
      label: r.name,
      value: r.name,
    }));
  });

  public readonly statusOptions: SelectOption[] = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
  ];

  public readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const roleId = this.roleFilter();

    return this.repo.users().filter((user) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const clientName = (this.getUserClientName(user) || '').toLowerCase();
      const roleName = (user.role || (user.roles && user.roles[0]) || '').toLowerCase();
      const matchesQuery =
        !query ||
        fullName.includes(query) ||
        email.includes(query) ||
        clientName.includes(query) ||
        roleName.includes(query);

      const userStatus = user.status || 'Active';
      const matchesStatus = status === 'ALL' || userStatus.toLowerCase() === status.toLowerCase();

      const matchesRole =
        roleId === 'ALL' ||
        user.role === roleId ||
        (user.roleIds && user.roleIds.includes(roleId)) ||
        (user.roles && user.roles.includes(roleId)) ||
        (user.siteRoles && user.siteRoles.some((sr) => sr.role === roleId));

      return matchesQuery && matchesStatus && matchesRole;
    });
  });

  constructor() {
    this.repo.loadAll();
  }

  public ngOnInit(): void {
    // When user changes selected client in modal, dynamically load that client's sites
    this.form.controls.clientId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((selectedCid) => {
      const cidToFetch = selectedCid || this.auth.getActiveClientId();
      if (cidToFetch) {
        this.loadSitesForModal(cidToFetch);
      } else {
        this.modalSites.set(this.repo.sites());
      }
    });
  }

  public getClientName(clientId?: string, user?: User): string {
    if (user?.clientName) return user.clientName;
    const cid = clientId || user?.clientId;
    if (!cid) {
      if (user?.siteRoles && user.siteRoles.length > 0) {
        for (const sr of user.siteRoles) {
          const site = this.repo.sites().find((s) => s.id === sr.siteId);
          if (site?.clientId) {
            const client = this.repo
              .clients()
              .find((c) => c.id === site.clientId || c.id?.toLowerCase() === site.clientId.toLowerCase());
            if (client) return client.clientName ?? client.name;
          }
        }
      }
      if (user?.siteIds && user.siteIds.length > 0) {
        for (const sid of user.siteIds) {
          const site = this.repo.sites().find((s) => s.id === sid);
          if (site?.clientId) {
            const client = this.repo
              .clients()
              .find((c) => c.id === site.clientId || c.id?.toLowerCase() === site.clientId.toLowerCase());
            if (client) return client.clientName ?? client.name;
          }
        }
      }
      if (user?.siteId) {
        const site = this.repo.sites().find((s) => s.id === user.siteId);
        if (site?.clientId) {
          const client = this.repo
            .clients()
            .find((c) => c.id === site.clientId || c.id?.toLowerCase() === site.clientId.toLowerCase());
          if (client) return client.clientName ?? client.name;
        }
      }
      const activeCid = this.auth.selectedClientId() || this.auth.getActiveClientId();
      if (activeCid) {
        const client = this.repo
          .clients()
          .find((c) => c.id === activeCid || c.id?.toLowerCase() === activeCid.toLowerCase());
        if (client) return client.clientName ?? client.name;
      }
      return 'Global / Enterprise';
    }

    const client = this.repo
      .clients()
      .find(
        (c) => c.id === cid || c.id?.toLowerCase() === cid.toLowerCase() || c.name?.toLowerCase() === cid.toLowerCase(),
      );
    return client ? (client.clientName ?? client.name) : cid;
  }

  public getUserClientName(user: User): string {
    return this.getClientName(user.clientId, user);
  }

  public getSiteName(siteId?: string): string {
    if (!siteId) return 'All Sites';
    const site = this.repo.sites().find((s) => s.id === siteId) || this.modalSites().find((s) => s.id === siteId);
    return site ? (site.code ? `${site.name} (${site.code})` : site.name) : siteId;
  }

  public getSiteObj(siteId: string): Site | undefined {
    return this.repo.sites().find((s) => s.id === siteId) || this.modalSites().find((s) => s.id === siteId);
  }

  public getRoleName(role?: string): string {
    if (!role) return '—';
    const found = this.repo.roles().find((r) => r.id === role || r.name === role);
    return found ? found.name : role;
  }

  public getUserSiteRoles(user: User): { siteName: string; siteCode: string; role: string }[] {
    if (user.siteRoles && user.siteRoles.length > 0) {
      return user.siteRoles.map((sr) => {
        const site = this.getSiteObj(sr.siteId);
        return {
          siteName: site ? site.name : sr.siteId,
          siteCode: site ? site.code : '',
          role: sr.role,
        };
      });
    }
    if (user.siteIds && user.siteIds.length > 0) {
      const role = user.role || (user.roles && user.roles[0]) || 'Operator';
      return user.siteIds.map((sid) => {
        const site = this.getSiteObj(sid);
        return {
          siteName: site ? site.name : sid,
          siteCode: site ? site.code : '',
          role,
        };
      });
    }
    if (user.siteId) {
      const site = this.getSiteObj(user.siteId);
      return [
        {
          siteName: site ? site.name : user.siteId,
          siteCode: site ? site.code : '',
          role: user.role || 'Operator',
        },
      ];
    }
    return [];
  }

  public getUserSites(user: User): string[] {
    const list = this.getUserSiteRoles(user);
    if (list.length > 0) {
      return list.map((item) => (item.siteCode ? `${item.siteName} (${item.siteCode})` : item.siteName));
    }
    return ['All Sites'];
  }

  public getUserRoles(user: User): string[] {
    const list = this.getUserSiteRoles(user);
    if (list.length > 0) {
      const uniqueRoles = Array.from(new Set(list.map((item) => item.role)));
      return uniqueRoles;
    }
    if (user.role) {
      return [this.getRoleName(user.role)];
    }
    return ['Operator'];
  }

  public getInitials(firstName: string, lastName: string): string {
    const first = (firstName || '').trim()[0] || '';
    const last = (lastName || '').trim()[0] || '';
    const initials = (first + last).toUpperCase();
    return initials || 'US';
  }

  public togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  // --- Per-Site Role Assignment Helpers ---
  public isSiteSelected(siteId: string): boolean {
    return this.siteRoles().some((sr) => sr.siteId === siteId);
  }

  public getRoleForSite(siteId: string): string {
    const match = this.siteRoles().find((sr) => sr.siteId === siteId);
    return match ? match.role : this.globalDefaultRole();
  }

  public toggleSite(siteId: string): void {
    const current = [...this.siteRoles()];
    const index = current.findIndex((sr) => sr.siteId === siteId);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push({ siteId, role: this.globalDefaultRole() });
    }
    this.siteRoles.set(current);
  }

  public updateSiteRole(siteId: string, role: string): void {
    const current = this.siteRoles().map((sr) => (sr.siteId === siteId ? { ...sr, role } : sr));
    this.siteRoles.set(current);
  }

  public applyRoleToAllSelectedSites(role: string): void {
    this.globalDefaultRole.set(role);
    const current = this.siteRoles().map((sr) => ({ ...sr, role }));
    this.siteRoles.set(current);
  }

  public selectAllSites(): void {
    const defaultRole = this.globalDefaultRole();
    const allSiteRoles: SiteRoleItem[] = this.availableSites().map((s) => {
      const existing = this.siteRoles().find((sr) => sr.siteId === s.id);
      return { siteId: s.id, role: existing ? existing.role : defaultRole };
    });
    this.siteRoles.set(allSiteRoles);
  }

  public clearAllSites(): void {
    this.siteRoles.set([]);
  }

  public removeSite(siteId: string): void {
    this.siteRoles.update((list) => list.filter((sr) => sr.siteId !== siteId));
  }

  public openModal(user?: User): void {
    this.editingUser.set(user ?? null);
    this.showPassword.set(false);
    this.siteFilterQuery.set('');
    this.modalError.set('');

    const targetClientId = user?.clientId || this.auth.getActiveClientId();
    if (targetClientId) {
      this.loadSitesForModal(targetClientId);
    } else {
      this.modalSites.set(this.repo.sites());
    }

    if (user) {
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity();

      let initialSiteRoles: SiteRoleItem[] = [];
      if (user.siteRoles && user.siteRoles.length > 0) {
        initialSiteRoles = user.siteRoles.map((sr) => ({ siteId: sr.siteId, role: sr.role }));
      } else if (user.siteIds && user.siteIds.length > 0) {
        const role = user.role || (user.roles && user.roles[0]) || 'Operator';
        initialSiteRoles = user.siteIds.map((sid) => ({ siteId: sid, role }));
      } else if (user.siteId) {
        const role = user.role || (user.roles && user.roles[0]) || 'Operator';
        initialSiteRoles = [{ siteId: user.siteId, role }];
      }

      this.siteRoles.set(initialSiteRoles);
      if (initialSiteRoles.length > 0) {
        this.globalDefaultRole.set(initialSiteRoles[0].role);
      } else if (user.role) {
        this.globalDefaultRole.set(user.role);
      }

      this.form.reset({
        userName: user.userName || user.email || '',
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber || user.phoneNumber || '',
        clientId: user.clientId || '',
        status: user.status || 'Active',
      });
    } else {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.controls.password.updateValueAndValidity();

      const activeClientId = this.auth.getActiveClientId();
      this.siteRoles.set([]);
      this.globalDefaultRole.set('Operator');

      this.form.reset({
        userName: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        clientId: activeClientId || '',
        status: 'Active',
      });
    }
  }

  public closeModal(): void {
    this.editingUser.set(undefined);
    this.siteFilterQuery.set('');
    this.siteRoles.set([]);
    this.modalError.set('');
    this.form.reset();
  }

  public refresh(): void {
    this.repo.loadAll();
  }

  public saveUser(): void {
    this.modalError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const current = this.editingUser();
    this.isSaving.set(true);

    const siteRolesList = this.siteRoles();
    const primarySiteId = siteRolesList.length > 0 ? siteRolesList[0].siteId : undefined;
    const primaryRole = siteRolesList.length > 0 ? siteRolesList[0].role : this.globalDefaultRole();
    const siteIds = siteRolesList.map((sr) => sr.siteId);
    const roles = Array.from(new Set(siteRolesList.map((sr) => sr.role)));

    const selectedClientId = val.clientId || undefined;
    const selectedClientObj = selectedClientId
      ? this.repo
          .clients()
          .find((c) => c.id === selectedClientId || c.id?.toLowerCase() === selectedClientId.toLowerCase())
      : undefined;
    const clientName = selectedClientObj ? (selectedClientObj.clientName ?? selectedClientObj.name) : undefined;

    this.repo
      .saveUser({
        id: current?.id,
        userName: val.userName || val.email,
        password: val.password,
        firstName: val.firstName.trim(),
        lastName: val.lastName.trim(),
        email: val.email.trim(),
        mobileNumber: val.mobileNumber.trim(),
        clientId: selectedClientId,
        clientName: clientName,
        siteId: primarySiteId,
        siteIds: siteIds,
        role: primaryRole,
        roles: roles.length > 0 ? roles : [primaryRole],
        roleIds: roles.length > 0 ? roles : [primaryRole],
        siteRoles: siteRolesList,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
        },
        error: (err) => {
          this.isSaving.set(false);
          const errorMsg = this.repo.extractErrorMessage(err, 'Failed to save user. Please check your inputs.');
          this.modalError.set(errorMsg);
        },
      });
  }

  public deleteUser(user: User): void {
    const name = `${user.firstName} ${user.lastName}`;
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
      this.repo.deleteUser(user).subscribe();
    }
  }

  private loadSitesForModal(clientId: string): void {
    if (!clientId) return;
    this.repo.getSitesByClientId(clientId).subscribe({
      next: (sites) => {
        this.modalSites.set(sites);
      },
      error: () => {
        this.modalSites.set(this.repo.sites());
      },
    });
  }
}
