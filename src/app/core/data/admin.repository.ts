import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, catchError, tap } from 'rxjs';
import { AuthService } from 'core/auth/auth.service';
import { ClientService } from 'shared/services/client.service';
import { SiteService } from 'shared/services/site.service';
import { UserService } from 'shared/services/user.service';
import { RoleService } from 'shared/services/role.service';
import {
  Client,
  Site,
  Role,
  User,
  CreateClientRequest,
  UpdateClientRequest,
  CreateSiteRequest,
  UpdateSiteRequest,
  CreateUserRequest,
  UpdateUserRequest,
} from 'shared/types/admin/admin.interface';

type Envelope<T> = T | { data?: T; items?: T; value?: T; result?: T };

export function matchIds(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const cleanA = a.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = b.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanA === cleanB;
}

@Injectable({ providedIn: 'root' })
export class AdminRepository {
  private readonly clientService = inject(ClientService);
  private readonly siteService = inject(SiteService);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly auth = inject(AuthService);

  public readonly clients = signal<Client[]>([]);
  public readonly sites = signal<Site[]>([]);
  public readonly roles = signal<Role[]>([]);
  public readonly users = signal<User[]>([]);
  public readonly loading = signal(false);
  public readonly error = signal('');

  public loadAll(clientId?: string, siteId?: string): void {
    this.loading.set(true);
    this.error.set('');

    const targetCid = clientId || this.auth.getActiveClientId();
    const targetSid = siteId || this.auth.getActiveSiteId();

    const clients$ = this.auth.canManageClients()
      ? this.listClients().pipe(catchError(() => of([])))
      : (targetCid
          ? this.clientService.getById(targetCid).pipe(
              map((res) => this.unwrap(res)),
              map((raw) => (raw ? [this.normalizeClient(raw)] : [])),
              catchError(() => of([])),
            )
          : of([]));

    forkJoin({
      clients: clients$,
      sites: this.listSites(targetCid).pipe(catchError(() => of([]))),
      roles: this.listRoles().pipe(catchError(() => of([]))),
      users: this.listUsers(targetCid, targetSid).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (result) => {
        if (result.clients && result.clients.length > 0) {
          this.clients.update((existing) => {
            const map = new Map<string, Client>();
            existing.forEach((c) => map.set(c.id, c));
            result.clients.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
        this.sites.set(result.sites ?? []);
        this.roles.set(result.roles ?? []);
        this.users.set(result.users ?? []);
        this.loading.set(false);

        // If user is client admin or operator, merge their accessible sites
        if (!this.auth.isSystemAdmin()) {
          this.auth.getMySites().pipe(catchError(() => of([]))).subscribe({
            next: (userSites) => {
              if (userSites && userSites.length > 0) {
                const mappedSites: Site[] = userSites.map((us) => ({
                  id: us.id || us.siteId || '',
                  clientId: us.clientId || targetCid,
                  name: us.name,
                  code: us.code,
                  status: 'Active',
                  active: true,
                  isActive: true,
                }));
                this.sites.update((existing) => {
                  const map = new Map<string, Site>();
                  existing.forEach((s) => map.set(s.id, s));
                  mappedSites.forEach((s) => map.set(s.id, s));
                  return Array.from(map.values());
                });
              }
            },
          });
        }
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'Failed to load system data from backend.'));
        this.loading.set(false);
      },
    });
  }

  public loadClients(): void {
    if (!this.auth.canManageClients()) {
      this.clients.set([]);
      return;
    }
    this.loading.set(true);
    this.listClients().subscribe({
      next: (items) => {
        this.clients.set(items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'Failed to load clients.'));
        this.loading.set(false);
      },
    });
  }

  public loadSites(clientId?: string): void {
    this.loading.set(true);
    const targetCid = clientId || this.auth.getActiveClientId();
    this.listSites(targetCid).subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          this.sites.update((existing) => {
            const map = new Map<string, Site>();
            existing.forEach((s) => map.set(s.id, s));
            items.forEach((s) => map.set(s.id, s));
            return Array.from(map.values());
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'Failed to load sites.'));
        this.loading.set(false);
      },
    });
  }

  public loadRoles(): void {
    this.loading.set(true);
    this.listRoles().subscribe({
      next: (items) => {
        this.roles.set(items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'Failed to load roles.'));
        this.loading.set(false);
      },
    });
  }

  public loadUsers(clientId?: string, siteId?: string): void {
    this.loading.set(true);
    const targetCid = clientId || this.auth.getActiveClientId();
    const targetSid = siteId || this.auth.getActiveSiteId();

    this.listUsers(targetCid, targetSid).subscribe({
      next: (items) => {
        this.users.set(items ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.extractErrorMessage(err, 'Failed to load users.'));
        this.loading.set(false);
      },
    });
  }

  public getSitesByClientId(clientId?: string): Observable<Site[]> {
    const targetCid = clientId || this.auth.getActiveClientId();
    return this.listSites(targetCid).pipe(
      map((items) => {
        const matching = targetCid ? items.filter((s) => matchIds(s.clientId, targetCid)) : items;
        const result = matching.length > 0 ? matching : (items.length > 0 ? items : this.sites());
        if (result.length > 0) {
          this.sites.update((existing) => {
            const map = new Map<string, Site>();
            existing.forEach((s) => map.set(s.id, s));
            result.forEach((s) => map.set(s.id, s));
            return Array.from(map.values());
          });
        }
        return result;
      }),
      catchError(() => {
        const repoMatching = this.sites().filter((s) => !targetCid || matchIds(s.clientId, targetCid));
        return of(repoMatching.length > 0 ? repoMatching : this.sites());
      }),
    );
  }

  public getUsers(clientId?: string, siteId?: string): Observable<User[]> {
    return this.listUsers(clientId, siteId).pipe(catchError(() => of(this.users())));
  }

  public saveClient(client: { id?: string; clientName: string; name?: string; address?: string }): Observable<Client> {
    const isEdit = Boolean(client.id);
    const clientName = (client.clientName ?? client.name ?? '').trim();

    const request$: Observable<any> = isEdit
      ? this.clientService.updateClient(client.id!, { name: clientName })
      : this.clientService.createClient({ name: clientName });

    return request$.pipe(
      map((res) => this.unwrap(res)),
      map((raw) => this.normalizeClient(raw ?? { id: client.id ?? crypto.randomUUID(), ...client, name: clientName })),
      tap((saved) => {
        this.clients.update((items) => this.upsert(items, saved));
        this.loadClients();
      }),
    );
  }

  public patchClientActive(id: string, active: boolean): Observable<void> {
    return this.clientService.setActive(id, active).pipe(
      tap(() => {
        this.clients.update((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: active ? 'Active' : 'Inactive',
                  active,
                  isActive: active,
                }
              : item,
          ),
        );
      }),
    );
  }

  public saveSite(site: { id?: string; clientId: string; name: string; code: string }): Observable<Site> {
    const isEdit = Boolean(site.id);
    const clientId = (site.clientId || this.auth.getActiveClientId()).trim();
    const name = site.name.trim();
    const code = site.code.trim().toUpperCase();

    const payload: CreateSiteRequest = {
      clientId,
      name,
      code,
    };

    const request$: Observable<any> = isEdit
      ? this.siteService.updateSite(site.id!, payload)
      : this.siteService.createSite(payload);

    return request$.pipe(
      map((res) => this.unwrap(res)),
      map((raw) => {
        let siteId = site.id;
        if (typeof raw === 'string') {
          siteId = raw;
        } else if (raw && typeof raw === 'object') {
          siteId = raw.id ?? raw.siteId ?? raw.SiteId ?? site.id;
        }
        return this.normalizeSite({
          id: siteId || crypto.randomUUID(),
          clientId,
          name,
          code,
          status: 'Active',
          active: true,
          isActive: true,
          ...(typeof raw === 'object' && raw !== null ? raw : {}),
        });
      }),
      tap((saved) => {
        this.sites.update((items) => this.upsert(items, saved));
        this.loadSites(clientId);
      }),
    );
  }

  public patchSiteActive(id: string, active: boolean): Observable<void> {
    return this.siteService.setActive(id, active).pipe(
      tap(() => {
        this.sites.update((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: active ? 'Active' : 'Inactive',
                  active,
                  isActive: active,
                }
              : item,
          ),
        );
      }),
    );
  }

  public saveRole(value: Role): void {
    this.roles.update((items) => this.upsert(items, value));
  }

  public saveUser(user: {
    id?: string;
    userName?: string;
    password?: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber?: string;
    clientId?: string;
    clientName?: string;
    siteId?: string;
    siteIds?: string[];
    role?: string;
    roles?: string[];
    roleIds?: string[];
    siteRoles?: { siteId: string; role: string }[];
  }): Observable<User> {
    const isEdit = Boolean(user.id);
    const firstName = user.firstName.trim();
    const lastName = user.lastName.trim();
    const email = user.email.trim();
    const mobileNumber = (user.mobileNumber ?? '').trim();
    const userName = (user.userName || email).trim();
    const clientId = user.clientId || undefined;
    const siteIds = user.siteIds && user.siteIds.length > 0 ? user.siteIds : user.siteId ? [user.siteId] : [];
    const siteId = siteIds[0] || user.siteId || undefined;
    const roles =
      user.roles && user.roles.length > 0
        ? user.roles
        : user.roleIds && user.roleIds.length > 0
          ? user.roleIds
          : user.role
            ? [user.role]
            : ['Operator'];
    const role = roles[0] || user.role || 'Operator';
    const siteRoles = user.siteRoles;

    const createPayload: CreateUserRequest = {
      userName,
      password: user.password || 'Prosper@123',
      firstName,
      lastName,
      email,
      mobileNumber,
      clientId,
      siteId,
      role,
      siteRoles: siteRoles?.map((sr) => ({ siteId: sr.siteId, role: sr.role })),
    };

    const updatePayload: UpdateUserRequest = {
      firstName,
      lastName,
      email,
      mobileNumber,
      siteRoles: siteRoles?.map((sr) => ({ siteId: sr.siteId, role: sr.role })),
    };

    const request$: Observable<any> = isEdit
      ? this.userService.updateUser(user.id!, updatePayload)
      : this.userService.createUser(createPayload);

    return request$.pipe(
      map((res) => this.unwrap(res)),
      map((raw) =>
        this.normalizeUser(
          raw ?? {
            id: user.id ?? crypto.randomUUID(),
            ...user,
            clientId,
            clientName: user.clientName,
            siteIds,
            siteId,
            role,
            roles,
            roleIds: roles,
          },
        ),
      ),
      tap((saved) => {
        if (!saved.clientId && clientId) {
          saved.clientId = clientId;
        }
        if (!saved.clientName && user.clientName) {
          saved.clientName = user.clientName;
        }
        this.users.update((items) => this.upsert(items, saved));
        this.loadUsers(clientId, siteId);
      }),
    );
  }

  public deleteUser(user: User): Observable<void> {
    const userId = user.id || user.userId || '';
    const siteId = user.siteId || (user.siteIds && user.siteIds[0] ? user.siteIds[0] : '');
    const clientId = user.clientId || '';
    const role =
      user.role ||
      (user.roles && user.roles[0] ? user.roles[0] : user.roleIds && user.roleIds[0] ? user.roleIds[0] : '');

    let deleteReq$: Observable<void>;
    if (siteId && role) {
      deleteReq$ = this.userService.removeSiteRole(userId, siteId, role);
    } else if (clientId && role) {
      deleteReq$ = this.userService.removeClientRole(userId, clientId, role);
    } else {
      deleteReq$ = this.userService.delete(userId);
    }

    return deleteReq$.pipe(
      tap(() => {
        this.users.update((items) => items.filter((u) => u.id !== userId));
      }),
      catchError(() => {
        return this.userService.delete(userId).pipe(
          tap(() => {
            this.users.update((items) => items.filter((u) => u.id !== userId));
          }),
        );
      }),
    );
  }

  private listClients(): Observable<Client[]> {
    if (!this.auth.canManageClients()) {
      return of([]);
    }
    return this.clientService.listClients().pipe(
      map((response) => this.unwrap(response)),
      map((items) => (Array.isArray(items) ? items.map((item) => this.normalizeClient(item)) : [])),
    );
  }

  private listSites(clientId?: string): Observable<Site[]> {
    const cid = clientId || this.auth.getActiveClientId();
    return this.siteService.listSites(cid).pipe(
      map((response) => this.unwrap(response)),
      map((items) =>
        Array.isArray(items)
          ? items.map((item) => {
              const normalized = this.normalizeSite(item);
              if (!normalized.clientId && cid) {
                normalized.clientId = cid;
              }
              return normalized;
            })
          : [],
      ),
    );
  }

  private listRoles(): Observable<Role[]> {
    return this.roleService.listRoles().pipe(
      map((response) => this.unwrap(response)),
      map((items) =>
        Array.isArray(items)
          ? items.map((r) => ({
              id: r.id || r.name,
              name: r.name,
              description: r.description || '',
              level: (r.level as any) || 'Site',
            }))
          : [],
      ),
    );
  }

  private listUsers(clientId?: string, siteId?: string): Observable<User[]> {
    const cid = clientId || this.auth.getActiveClientId();
    const sid = siteId || this.auth.getActiveSiteId();

    return this.userService.listUsers(cid, sid).pipe(
      map((response) => this.unwrap(response)),
      map((items) => (Array.isArray(items) ? items.map((item) => this.normalizeUser(item)) : [])),
    );
  }

  private normalizeClient(raw: any): Client {
    const id = String(raw.id ?? raw.clientId ?? raw.ClientId ?? crypto.randomUUID());
    const name = String(raw.name ?? raw.Name ?? raw.clientName ?? raw.ClientName ?? 'Unnamed Client');
    const address = raw.address ?? raw.Address ?? '';
    const code = raw.code ?? raw.Code ?? name.slice(0, 3).toUpperCase();
    const email = raw.email ?? raw.Email ?? '';
    const isActive =
      raw.active !== undefined
        ? Boolean(raw.active)
        : raw.isActive !== undefined
          ? Boolean(raw.isActive)
          : raw.Active !== undefined
            ? Boolean(raw.Active)
            : raw.status !== 'Inactive';
    const status: 'Active' | 'Inactive' = isActive ? 'Active' : 'Inactive';

    return {
      id,
      name,
      clientName: name,
      address,
      code,
      email,
      status,
      active: isActive,
      isActive,
    };
  }

  private normalizeSite(raw: any): Site {
    const id = String(raw.id ?? raw.siteId ?? raw.SiteId ?? crypto.randomUUID());
    const clientId = String(
      raw.clientId ??
      raw.ClientId ??
      raw.client_id ??
      raw.client?.id ??
      raw.Client?.Id ??
      raw.client?.clientId ??
      raw.Client?.ClientId ??
      ''
    );
    const name = String(raw.name ?? raw.Name ?? raw.siteName ?? raw.SiteName ?? 'Unnamed Site');
    const code = String(raw.code ?? raw.Code ?? raw.siteCode ?? raw.SiteCode ?? '');
    const city = raw.city ?? raw.City ?? '';
    const isActive =
      raw.active !== undefined
        ? Boolean(raw.active)
        : raw.isActive !== undefined
          ? Boolean(raw.isActive)
          : raw.Active !== undefined
            ? Boolean(raw.Active)
            : raw.status !== 'Inactive';
    const status: 'Active' | 'Inactive' = isActive ? 'Active' : 'Inactive';

    const clientName = String(
      raw.clientName ?? raw.ClientName ?? raw.client?.name ?? raw.client?.clientName ?? raw.Client?.Name ?? '',
    ).trim();

    if (clientId && clientName && clientName !== 'Primary Client') {
      this.clients.update((items) =>
        this.upsert(items, {
          id: clientId,
          name: clientName,
          clientName: clientName,
          code: '',
          status: 'Active',
          active: true,
          isActive: true,
        }),
      );
    }

    return {
      id,
      clientId,
      name,
      code,
      city,
      status,
      active: isActive,
      isActive,
    };
  }

  private normalizeUser(raw: any): User {
    const id = String(raw.id ?? raw.userId ?? raw.UserId ?? crypto.randomUUID());
    const firstName = String(raw.firstName ?? raw.FirstName ?? '');
    const lastName = String(raw.lastName ?? raw.LastName ?? '');
    const email = String(raw.email ?? raw.Email ?? raw.userName ?? raw.UserName ?? '');
    const userName = String(raw.userName ?? raw.UserName ?? email);
    const mobileNumber = String(raw.mobileNumber ?? raw.MobileNumber ?? raw.phoneNumber ?? raw.PhoneNumber ?? '');
    const clientId = String(raw.clientId ?? raw.ClientId ?? raw.client?.id ?? raw.Client?.Id ?? '');
    const clientName =
      raw.clientName ?? raw.ClientName ?? raw.client?.clientName ?? raw.client?.name ?? raw.Client?.Name ?? '';
    const siteId = String(
      raw.siteId ?? raw.SiteId ?? (Array.isArray(raw.siteIds) && raw.siteIds[0] ? raw.siteIds[0] : ''),
    );
    const siteIds = Array.isArray(raw.siteIds) ? raw.siteIds : siteId ? [siteId] : [];
    const role = String(
      raw.role ??
        raw.Role ??
        (Array.isArray(raw.roles) && raw.roles[0]
          ? raw.roles[0]
          : Array.isArray(raw.roleIds) && raw.roleIds[0]
            ? raw.roleIds[0]
            : ''),
    );
    const roleIds = Array.isArray(raw.roleIds)
      ? raw.roleIds
      : Array.isArray(raw.roles)
        ? raw.roles
        : role
          ? [role]
          : [];
    const isActive =
      raw.active !== undefined
        ? Boolean(raw.active)
        : raw.isActive !== undefined
          ? Boolean(raw.isActive)
          : raw.Active !== undefined
            ? Boolean(raw.Active)
            : raw.status !== 'Inactive';
    const status: 'Active' | 'Inactive' = isActive ? 'Active' : 'Inactive';

    return {
      id,
      userId: id,
      userName,
      firstName,
      lastName,
      email,
      mobileNumber,
      clientId,
      clientName: clientName || undefined,
      client: raw.client,
      siteId,
      siteIds,
      role,
      roleIds,
      roles: roleIds,
      siteRoles: raw.siteRoles ?? raw.SiteRoles,
      status,
      active: isActive,
      isActive,
    };
  }

  private unwrap<T>(response: Envelope<T>): T {
    if (!response) return response as T;
    const box = response as { data?: T; items?: T; value?: T; result?: T };
    return box.data ?? box.items ?? box.value ?? box.result ?? (response as T);
  }

  private upsert<T extends { id: string }>(items: T[], value: T): T[] {
    return items.some((item) => item.id === value.id)
      ? items.map((item) => (item.id === value.id ? value : item))
      : [...items, value];
  }

  public extractErrorMessage(error: any, fallback: string): string {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    if (typeof error.error === 'string' && error.error.trim().length > 0) return error.error;

    if (error.error?.errors && typeof error.error.errors === 'object') {
      const messages = Object.values(error.error.errors)
        .flat()
        .filter((m: any) => typeof m === 'string' && m.trim().length > 0);
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }

    return error?.error?.detail ?? error?.error?.message ?? error?.error?.title ?? error?.message ?? fallback;
  }
}
