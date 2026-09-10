import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, catchError, tap } from 'rxjs';
import { ApiUrlService } from 'core/services/api.url.service';
import { AuthService } from 'core/auth/auth.service';
import { Client, Role, Site, User } from 'core/models/admin.models';

type Resource = 'clients' | 'sites' | 'roles' | 'users';
type Envelope<T> = T | { data?: T; items?: T; value?: T; result?: T };

const SEED_CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'Sarweshwar CFS Nhava Sheva',
    clientName: 'Sarweshwar CFS Nhava Sheva',
    code: 'SNS',
    status: 'Active',
    active: true,
    isActive: true,
    email: 'operations@sarweshwar.com',
    address: 'Sector 10, Dronagiri Node, Navi Mumbai, Maharashtra 400707',
  },
  {
    id: 'c-2',
    name: 'JNPT Maritime Logistics',
    clientName: 'JNPT Maritime Logistics',
    code: 'JML',
    status: 'Active',
    active: true,
    isActive: true,
    email: 'cfs.support@jnptlogistics.in',
    address: 'Port Users Building, JNPT SEZ, Nhava Sheva 400721',
  },
  {
    id: 'c-3',
    name: 'APM Terminals Gateway',
    clientName: 'APM Terminals Gateway',
    code: 'APM',
    status: 'Active',
    active: true,
    isActive: true,
    email: 'gateway.admin@apmterminals.com',
    address: 'Container Gate Road, Uran, Navi Mumbai 400702',
  },
];

const SEED_SITES: Site[] = [
  {
    id: 's-1',
    clientId: 'c-1',
    name: 'Dronagiri CFS Yard A',
    code: 'DNY-A',
    city: 'Navi Mumbai',
    status: 'Active',
    active: true,
    isActive: true,
  },
  {
    id: 's-2',
    clientId: 'c-1',
    name: 'Dronagiri CFS Yard B',
    code: 'DNY-B',
    city: 'Navi Mumbai',
    status: 'Active',
    active: true,
    isActive: true,
  },
  {
    id: 's-3',
    clientId: 'c-2',
    name: 'JNPT Terminal Berth 4',
    code: 'JMT-04',
    city: 'Nhava Sheva',
    status: 'Active',
    active: true,
    isActive: true,
  },
  {
    id: 's-4',
    clientId: 'c-3',
    name: 'Gateway Inland Container Depot',
    code: 'GICD-01',
    city: 'Uran',
    status: 'Active',
    active: true,
    isActive: true,
  },
];

const SEED_ROLES: Role[] = [
  {
    id: 'r-1',
    name: 'SystemAdmin',
    description: 'Full terminal and enterprise control tower access with global authority',
    level: 'Client',
  },
  {
    id: 'r-2',
    name: 'Yard Supervisor',
    description: 'Stacker dispatch, reach-stacker tasks, container moves, and RTK yard management',
    level: 'Site',
  },
  {
    id: 'r-3',
    name: 'Gate Operator',
    description: 'Gate OCR inspection, ANPR camera feeds, and in/out container check-in',
    level: 'Site',
  },
  {
    id: 'r-4',
    name: 'CFS Surveyor',
    description: 'Container damage inspection, seal verification, and evidence photo upload',
    level: 'Site',
  },
];

const SEED_USERS: User[] = [
  {
    id: 'u-1',
    firstName: 'Vijay',
    lastName: 'Mahale',
    email: 'vijay.mahale@sarweshwar.com',
    userName: 'vijay.mahale@sarweshwar.com',
    role: 'SystemAdmin',
    clientId: 'c-1',
    clientName: 'Sarweshwar CFS Nhava Sheva',
    siteId: 's-1',
    status: 'Active',
    active: true,
    isActive: true,
    mobileNumber: '+91 98201 12345',
  },
  {
    id: 'u-2',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@sarweshwar.com',
    userName: 'rajesh.kumar@sarweshwar.com',
    role: 'Yard Supervisor',
    clientId: 'c-1',
    clientName: 'Sarweshwar CFS Nhava Sheva',
    siteId: 's-1',
    status: 'Active',
    active: true,
    isActive: true,
    mobileNumber: '+91 98202 23456',
  },
  {
    id: 'u-3',
    firstName: 'Amit',
    lastName: 'Sharma',
    email: 'amit.sharma@sarweshwar.com',
    userName: 'amit.sharma@sarweshwar.com',
    role: 'Gate Operator',
    clientId: 'c-1',
    clientName: 'Sarweshwar CFS Nhava Sheva',
    siteId: 's-2',
    status: 'Active',
    active: true,
    isActive: true,
    mobileNumber: '+91 98203 34567',
  },
  {
    id: 'u-4',
    firstName: 'Pooja',
    lastName: 'Patil',
    email: 'pooja.patil@sarweshwar.com',
    userName: 'pooja.patil@sarweshwar.com',
    role: 'CFS Surveyor',
    clientId: 'c-1',
    clientName: 'Sarweshwar CFS Nhava Sheva',
    siteId: 's-1',
    status: 'Active',
    active: true,
    isActive: true,
    mobileNumber: '+91 98204 45678',
  },
];

@Injectable({ providedIn: 'root' })
export class AdminRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);
  private readonly auth = inject(AuthService);

  private get baseUrl(): string {
    return this.apiUrlService.apiUrl;
  }

  public readonly clients = signal<Client[]>(SEED_CLIENTS);
  public readonly sites = signal<Site[]>(SEED_SITES);
  public readonly roles = signal<Role[]>(SEED_ROLES);
  public readonly users = signal<User[]>(SEED_USERS);
  public readonly loading = signal(false);
  public readonly error = signal('');

  public loadAll(clientId?: string, siteId?: string): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      clients: this.listClients().pipe(catchError(() => of([]))),
      sites: this.listSites(clientId).pipe(catchError(() => of([]))),
      roles: this.list<Role>('roles').pipe(catchError(() => of([]))),
      users: this.listUsers(clientId, siteId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (result) => {
        if (result.clients?.length) this.clients.set(result.clients);
        if (result.sites?.length) this.sites.set(result.sites);
        if (result.roles?.length) this.roles.set(result.roles);
        if (result.users?.length) this.users.set(result.users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  public loadClients(): void {
    this.loading.set(true);
    this.listClients().subscribe({
      next: (items) => {
        if (items?.length) this.clients.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  public loadSites(clientId?: string): void {
    this.loading.set(true);
    this.listSites(clientId).subscribe({
      next: (items) => {
        if (items?.length) this.sites.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  public loadUsers(clientId?: string, siteId?: string): void {
    this.loading.set(true);
    this.listUsers(clientId, siteId).subscribe({
      next: (items) => {
        if (items?.length) this.users.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  public getSitesByClientId(clientId?: string): Observable<Site[]> {
    return this.listSites(clientId).pipe(
      catchError(() => of(this.sites().filter((s) => !clientId || s.clientId === clientId))),
    );
  }

  public getUsers(clientId?: string, siteId?: string): Observable<User[]> {
    return this.listUsers(clientId, siteId).pipe(catchError(() => of(this.users())));
  }

  public saveClient(client: { id?: string; clientName: string; name?: string; address?: string }): Observable<Client> {
    const isEdit = Boolean(client.id);
    const clientName = (client.clientName ?? client.name ?? '').trim();
    const payload = {
      ClientName: clientName,
    };

    const request$ = isEdit
      ? this.http.put<any>(`${this.baseUrl}/clients/${client.id}`, payload)
      : this.http.post<any>(`${this.baseUrl}/clients`, payload);

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
    return this.http.patch<void>(`${this.baseUrl}/clients/${id}/active/${active}`, {}).pipe(
      map(() => {
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

    const payload = {
      ClientId: clientId,
      Name: name,
      Code: code,
    };

    const request$ = isEdit
      ? this.http.put<any>(`${this.baseUrl}/sites/${site.id}`, payload)
      : this.http.post<any>(`${this.baseUrl}/sites`, payload);

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
    return this.http.patch<void>(`${this.baseUrl}/sites/${id}/active/${active}`, {}).pipe(
      map(() => {
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
    this.save('roles', value, this.roles);
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

    const payload = isEdit
      ? {
          FirstName: firstName,
          LastName: lastName,
          Email: email,
          MobileNumber: mobileNumber,
          ClientId: clientId,
          SiteId: siteId,
          SiteIds: siteIds,
          Role: role,
          Roles: roles,
          RoleIds: roles,
          SiteRoles: siteRoles,
        }
      : {
          UserName: userName,
          Password: user.password || 'Prosper@123',
          FirstName: firstName,
          LastName: lastName,
          Email: email,
          MobileNumber: mobileNumber,
          ...(clientId ? { ClientId: clientId } : {}),
          ...(siteId ? { SiteId: siteId } : {}),
          SiteIds: siteIds,
          Role: role,
          Roles: roles,
          RoleIds: roles,
          SiteRoles: siteRoles,
        };

    const request$ = isEdit
      ? this.http.put<Envelope<any>>(`${this.baseUrl}/users/${user.id}`, payload)
      : this.http.post<Envelope<any>>(`${this.baseUrl}/users`, payload);

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
      map((saved) => {
        if (!saved.clientId && clientId) {
          saved.clientId = clientId;
        }
        if (!saved.clientName && user.clientName) {
          saved.clientName = user.clientName;
        }
        this.users.update((items) => this.upsert(items, saved));
        this.loadUsers(clientId, siteId);
        return saved;
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

    let url = `${this.baseUrl}/users/${userId}`;
    if (siteId && role) {
      url = `${this.baseUrl}/users/${userId}/site-roles/${siteId}/${encodeURIComponent(role)}`;
    } else if (clientId && role) {
      url = `${this.baseUrl}/users/${userId}/client-roles/${clientId}/${encodeURIComponent(role)}`;
    }

    return this.http.delete<void>(url).pipe(
      map(() => {
        this.users.update((items) => items.filter((u) => u.id !== userId));
      }),
      catchError(() => {
        return this.http.delete<void>(`${this.baseUrl}/users/${userId}`).pipe(
          map(() => {
            this.users.update((items) => items.filter((u) => u.id !== userId));
          }),
        );
      }),
    );
  }

  public delete(resource: Resource, id: string): void {
    this.http.delete(`${this.baseUrl}/${resource}/${id}`).subscribe({
      next: () => this.getSignal(resource).update((items: any[]) => items.filter((item) => item.id !== id)),
      error: (error) => this.error.set(this.errorMessage(error, `Unable to delete ${resource.slice(0, -1)}.`)),
    });
  }

  private listClients(): Observable<Client[]> {
    return this.http.get<Envelope<any[]>>(`${this.baseUrl}/clients`).pipe(
      map((response) => this.unwrap(response)),
      map((items) => (Array.isArray(items) ? items.map((item) => this.normalizeClient(item)) : [])),
    );
  }

  private listSites(clientId?: string): Observable<Site[]> {
    const cid = clientId || this.auth.getActiveClientId();
    const url = cid ? `${this.baseUrl}/sites?ClientId=${encodeURIComponent(cid)}` : `${this.baseUrl}/sites`;

    return this.http.get<Envelope<any[]>>(url).pipe(
      map((response) => this.unwrap(response)),
      map((items) => (Array.isArray(items) ? items.map((item) => this.normalizeSite(item)) : [])),
    );
  }

  private listUsers(clientId?: string, siteId?: string): Observable<User[]> {
    const cid = clientId || this.auth.getActiveClientId();
    const sid = siteId || this.auth.getActiveSiteId();

    const params: string[] = [];
    if (cid) params.push(`ClientId=${encodeURIComponent(cid)}`);
    if (sid) params.push(`SiteId=${encodeURIComponent(sid)}`);

    const query = params.length > 0 ? `?${params.join('&')}` : '';
    const url = `${this.baseUrl}/users${query}`;

    return this.http.get<Envelope<any[]>>(url).pipe(
      map((response) => this.unwrap(response)),
      map((items) => (Array.isArray(items) ? items.map((item) => this.normalizeUser(item)) : [])),
    );
  }

  private normalizeClient(raw: any): Client {
    const id = String(raw.id ?? raw.clientId ?? raw.ClientId ?? crypto.randomUUID());
    const name = String(raw.clientName ?? raw.ClientName ?? raw.name ?? 'Unnamed Client');
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
    const clientId = String(raw.clientId ?? raw.ClientId ?? '');
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

    return {
      id,
      clientId,
      name,
      code,
      city,
      status,
      active: isActive,
      isActive,
    } as any;
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
      status,
      active: isActive,
      isActive,
    };
  }

  private list<T>(resource: Resource) {
    return this.http.get<Envelope<T[]>>(`${this.baseUrl}/${resource}`).pipe(map((response) => this.unwrap(response)));
  }

  private save<T extends { id: string }>(resource: Resource, value: T, target: any): void {
    const exists = target().some((item: T) => item.id === value.id);
    const request = exists
      ? this.http.put<Envelope<T>>(`${this.baseUrl}/${resource}/${value.id}`, value)
      : this.http.post<Envelope<T>>(`${this.baseUrl}/${resource}`, value);
    request.pipe(map((response) => this.unwrap(response))).subscribe({
      next: (saved) => target.update((items: T[]) => this.upsert(items, saved ?? value)),
      error: (error) => this.error.set(this.errorMessage(error, `Unable to save ${resource.slice(0, -1)}.`)),
    });
  }

  private getSignal(resource: Resource): any {
    return { clients: this.clients, sites: this.sites, roles: this.roles, users: this.users }[resource];
  }

  private unwrap<T>(response: Envelope<T>): T {
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

  private errorMessage(error: any, fallback: string): string {
    return this.extractErrorMessage(error, fallback);
  }
}
