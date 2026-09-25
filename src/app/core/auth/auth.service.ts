import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';
import { ApiUrlService } from 'core/services/api.url.service';
import {
  ContextClient,
  ContextRequest,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  ChangePasswordRequest,
  UserSiteDto,
  NavigationModuleDto,
} from 'shared/types/auth/auth.interface';

export type { ContextClient, NavigationModuleDto };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrlService = inject(ApiUrlService);

  private readonly tokenKey = 'cfs_admin_token';
  private readonly refreshTokenKey = 'cfs_admin_refresh_token';
  private readonly clientContextKey = 'cfs_selected_client_id';
  private readonly siteContextKey = 'cfs_selected_site_id';
  private readonly explicitLogoutKey = 'cfs_explicit_logout';

  public readonly authenticated = signal<boolean>(
    typeof sessionStorage !== 'undefined' ? Boolean(sessionStorage.getItem(this.tokenKey)) : false,
  );
  public readonly loading = signal(false);
  public readonly contextLoading = signal(false);
  public readonly sessionExpired = signal(false);

  public readonly userClaims = signal<any>(this.getDecodedToken());
  public readonly accessibleUserSites = signal<UserSiteDto[]>([]);
  public readonly selectedClientId = signal<string>(
    typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem(this.clientContextKey) ?? '') : '',
  );
  public readonly selectedSiteId = signal<string>(
    typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem(this.siteContextKey) ?? '') : '',
  );

  private get apiBaseUrl(): string {
    return this.apiUrlService.apiUrl;
  }

  constructor() {
    this.initContextFromToken();
    if (this.authenticated()) {
      this.loadMySites();
      this.loadMyModules();
    }
  }

  public readonly sidebarModules = signal<NavigationModuleDto[]>([]);

  public readonly isSystemAdmin = computed<boolean>(() => {
    const claims = this.userClaims();
    if (!claims) return false;
    const roleClaim =
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      claims['role'] ??
      claims['roles'] ??
      claims['Role'] ??
      claims['Roles'];

    if (Array.isArray(roleClaim)) {
      return roleClaim.some((r) => String(r).trim().toLowerCase() === 'systemadmin');
    }
    return (
      String(roleClaim ?? '')
        .trim()
        .toLowerCase() === 'systemadmin'
    );
  });

  public readonly isClientAdmin = computed<boolean>(() => {
    return this.hasRole('ClientAdmin');
  });

  public readonly isSiteAdmin = computed<boolean>(() => {
    return this.hasRole('SiteAdmin');
  });

  public readonly isUserRole = computed<boolean>(() => {
    return this.hasRole('User') || (!this.isSystemAdmin() && !this.isClientAdmin() && !this.isSiteAdmin());
  });

  public readonly hasAdminAccess = computed<boolean>(() => {
    return this.isSystemAdmin() || this.isClientAdmin() || this.isSiteAdmin();
  });

  public readonly hasClientsAccess = computed<boolean>(() => {
    return this.isSystemAdmin() || this.isClientAdmin();
  });

  /**
   * Checks whether the active user possesses any of the specified roles.
   * SystemAdmin always passes role checks.
   */
  public hasRole(roles: string | string[]): boolean {
    if (this.isSystemAdmin()) return true;
    const claims = this.userClaims();
    if (!claims) return false;
    const roleClaim =
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      claims['role'] ??
      claims['roles'] ??
      claims['Role'] ??
      claims['Roles'];

    const userRoles = Array.isArray(roleClaim)
      ? roleClaim.map((r) => String(r).trim().toLowerCase())
      : [
          String(roleClaim ?? '')
            .trim()
            .toLowerCase(),
        ];

    const targetRoles = Array.isArray(roles)
      ? roles.map((r) => String(r).trim().toLowerCase())
      : [String(roles).trim().toLowerCase()];

    return targetRoles.some((role) => userRoles.includes(role));
  }

  /**
   * Evaluates if active user has permission to manage and view all clients (SystemAdmin or ClientAdmin)
   */
  public readonly canManageClients = computed<boolean>(() => {
    return this.isSystemAdmin() || this.hasRole(['SystemAdmin', 'ClientAdmin']);
  });

  /**
   * Extracts available client list from token claims if provided by backend
   */
  public readonly tokenClients = computed<ContextClient[]>(() => {
    const claims = this.userClaims();
    if (!claims) return [];

    const clientMap = new Map<string, ContextClient>();

    const rawClients =
      claims['clients'] ??
      claims['Clients'] ??
      claims['client_list'] ??
      claims['ClientList'] ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/client'];

    if (rawClients) {
      let parsedList: any[] = [];
      if (typeof rawClients === 'string') {
        try {
          const parsed = JSON.parse(rawClients);
          parsedList = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          parsedList = rawClients.split(',').map((id) => ({ id: id.trim(), name: id.trim() }));
        }
      } else if (Array.isArray(rawClients)) {
        parsedList = rawClients;
      } else if (typeof rawClients === 'object') {
        parsedList = [rawClients];
      }

      parsedList.forEach((item) => {
        if (typeof item === 'string') {
          const id = item.trim();
          if (id) clientMap.set(id, { id, name: id });
        } else if (item && typeof item === 'object') {
          const id = String(item.ClientId ?? item.clientId ?? item.client_ids ?? item.id ?? item.Id ?? '').trim();
          const name = String(item.ClientName ?? item.clientName ?? item.name ?? item.Name ?? (id || 'Client'));
          const code = item.Code ?? item.code;
          if (id) clientMap.set(id, { id, name, code });
        }
      });
    }

    // Check client_role claims (e.g. "01a07f00...|ClientAdmin")
    const rawClientRole = claims['client_role'] ?? claims['ClientRole'];
    if (rawClientRole) {
      const entries = Array.isArray(rawClientRole) ? rawClientRole : String(rawClientRole).split(',');
      entries.forEach((entry: any) => {
        const parts = String(entry).trim().split('|');
        const cid = parts[0]?.trim();
        const role = parts[1]?.trim() || '';
        if (cid && !clientMap.has(cid)) {
          clientMap.set(cid, {
            id: cid,
            name: role ? `Client (${role}) - ${cid.slice(0, 8)}` : `Client (${cid.slice(0, 8)})`,
            code: role,
          });
        }
      });
    }

    // Check client_ids claims
    const rawCids = claims['client_ids'] ?? claims['ClientId'] ?? claims['clientId'] ?? claims['client_id'];
    const singleName = claims['ClientName'] ?? claims['clientName'] ?? claims['client'] ?? 'Primary Client';

    if (rawCids) {
      const ids = Array.isArray(rawCids)
        ? rawCids.map((id) => String(id).trim()).filter(Boolean)
        : String(rawCids)
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);

      ids.forEach((id, index) => {
        if (!clientMap.has(id)) {
          clientMap.set(id, {
            id,
            name: ids.length === 1 && singleName ? String(singleName) : `Client ${index + 1} (${id.slice(0, 8)})`,
          });
        }
      });
    }

    return Array.from(clientMap.values());
  });

  /**
   * Extracts available sites list strictly from token claims and accessible sites API.
   * Handles multiple sites from site_ids, site_role, sites, or user_sites claims.
   */
  public readonly tokenSites = computed<UserSiteDto[]>(() => {
    const claims = this.userClaims();
    if (!claims) return [];

    const siteMap = new Map<string, UserSiteDto>();

    // 0. Include accessible sites loaded from /api/auth/me/sites
    for (const s of this.accessibleUserSites()) {
      const id = (s.id || s.siteId || '').trim();
      if (id) {
        siteMap.set(id, { ...s, id, siteId: id });
      }
    }

    const rawCid = claims['client_ids'] ?? claims['ClientId'] ?? claims['clientId'] ?? claims['client_id'] ?? '';
    const primaryCid = Array.isArray(rawCid) ? String(rawCid[0]) : String(rawCid).split(',')[0].trim();

    // 1. Check structured sites claims (e.g. sites array or JSON)
    const rawSites =
      claims['sites'] ??
      claims['Sites'] ??
      claims['site_list'] ??
      claims['SiteList'] ??
      claims['user_sites'] ??
      claims['UserSites'] ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/site'];

    if (rawSites) {
      let parsedList: any[] = [];
      if (typeof rawSites === 'string') {
        try {
          const parsed = JSON.parse(rawSites);
          parsedList = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          parsedList = rawSites.split(',').map((id) => ({ id: id.trim(), name: id.trim() }));
        }
      } else if (Array.isArray(rawSites)) {
        parsedList = rawSites;
      } else if (typeof rawSites === 'object') {
        parsedList = [rawSites];
      }

      parsedList.forEach((item) => {
        if (typeof item === 'string') {
          const sid = item.trim();
          if (sid && !siteMap.has(sid)) {
            siteMap.set(sid, {
              id: sid,
              siteId: sid,
              name: `Site (${sid.slice(0, 8)})`,
              code: '',
              clientId: primaryCid,
            });
          }
        } else if (item && typeof item === 'object') {
          const id = String(item.SiteId ?? item.siteId ?? item.site_ids ?? item.id ?? item.Id ?? '').trim();
          const name = String(
            item.SiteName ?? item.siteName ?? item.name ?? item.Name ?? (id ? `Site (${id.slice(0, 8)})` : 'Site'),
          );
          const code = String(item.Code ?? item.code ?? item.SiteCode ?? item.siteCode ?? '');
          const clientId = String(item.ClientId ?? item.clientId ?? item.client_ids ?? item.client_id ?? primaryCid);
          if (id) {
            const existing = siteMap.get(id);
            if (!existing) {
              siteMap.set(id, { id, siteId: id, name, code, clientId });
            } else {
              siteMap.set(id, {
                ...existing,
                name: !existing.name || existing.name.startsWith('Site (') ? name : existing.name,
                code: code || existing.code,
                clientId: clientId || existing.clientId,
              });
            }
          }
        }
      });
    }

    // 2. Check site_role claim (e.g. "01a07fd0-d69a-7998-bd0c-48b96d3b8a88|SiteAdmin,01a07fd0-d69a-7998-bd0c-48b96d3b8a89|Operator")
    const rawSiteRole = claims['site_role'] ?? claims['SiteRole'];
    if (rawSiteRole) {
      const entries = Array.isArray(rawSiteRole) ? rawSiteRole : String(rawSiteRole).split(',');

      entries.forEach((entry: any) => {
        const parts = String(entry).trim().split('|');
        const sid = parts[0]?.trim();
        const role = parts[1]?.trim() || '';
        if (sid && !siteMap.has(sid)) {
          siteMap.set(sid, {
            id: sid,
            siteId: sid,
            name: role ? `Site (${role}) - ${sid.slice(0, 8)}` : `Site (${sid.slice(0, 8)})`,
            code: role,
            clientId: primaryCid,
          });
        }
      });
    }

    // 3. Check site_ids claim (e.g. "01a07fd0-d69a-7998-bd0c-48b96d3b8a88,01a07fd0-d69a-7998-bd0c-48b96d3b8a89")
    const rawSiteIds = claims['site_ids'] ?? claims['SiteId'] ?? claims['siteId'] ?? claims['site_id'];
    if (rawSiteIds) {
      const ids = Array.isArray(rawSiteIds)
        ? rawSiteIds.map((id) => String(id).trim()).filter(Boolean)
        : String(rawSiteIds)
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);

      const singleName = claims['SiteName'] ?? claims['siteName'] ?? claims['site'];

      ids.forEach((id, index) => {
        if (!siteMap.has(id)) {
          siteMap.set(id, {
            id,
            siteId: id,
            name: ids.length === 1 && singleName ? String(singleName) : `Site ${index + 1} (${id.slice(0, 8)})`,
            code: '',
            clientId: primaryCid,
          });
        }
      });
    }

    return Array.from(siteMap.values());
  });

  /**
   * Loads the current user's accessible sites from /api/auth/me/sites
   */
  public loadMySites(): void {
    if (!this.authenticated() || this.isBypassMode()) return;
    this.getMySites()
      .pipe(catchError(() => of([])))
      .subscribe({
        next: (sites) => {
          if (sites && sites.length > 0) {
            this.accessibleUserSites.set(sites);
          }
        },
      });
  }

  public readonly userName = computed<string>(() => {
    const claims = this.userClaims();
    if (!claims) return 'User';
    return (
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'] ??
      claims['name'] ??
      claims['unique_name'] ??
      claims['email'] ??
      claims['sub'] ??
      'User'
    );
  });

  public readonly userRoleDisplay = computed<string>(() => {
    const claims = this.userClaims();
    if (!claims) return 'User';
    const role =
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      claims['role'] ??
      claims['Role'] ??
      claims['roles'];
    if (Array.isArray(role)) return role.join(', ');
    return role ? String(role) : 'User';
  });

  public readonly clientName = computed<string>(() => {
    const claims = this.userClaims();
    if (!claims) return 'Primary Client';

    const rawName =
      claims['ClientName'] ??
      claims['clientName'] ??
      claims['client'] ??
      claims['Client'] ??
      claims['Company'] ??
      claims['company'] ??
      claims['org_name'] ??
      claims['OrgName'];
    if (rawName) return String(rawName);

    const tokenClients = this.tokenClients();
    const selectedCid = this.selectedClientId() || this.getActiveClientId();
    if (selectedCid) {
      const match = tokenClients.find((c) => c.id === selectedCid);
      if (match && match.name) return match.name;
    }
    if (tokenClients.length > 0 && tokenClients[0].name) {
      return tokenClients[0].name;
    }

    return selectedCid
      ? selectedCid.length > 8
        ? `Client (${selectedCid.slice(0, 8)})`
        : selectedCid
      : 'Primary Client';
  });

  public readonly siteName = computed<string>(() => {
    const claims = this.userClaims();
    if (!claims) return 'Main Terminal';

    const selectedSid = this.selectedSiteId() || this.getActiveSiteId();
    const tokenSites = this.tokenSites();

    if (selectedSid) {
      const match = tokenSites.find((s) => s.id === selectedSid || s.siteId === selectedSid);
      if (match && match.name) return match.name;
    }

    const rawName =
      claims['SiteName'] ??
      claims['siteName'] ??
      claims['site'] ??
      claims['Site'] ??
      claims['location_name'] ??
      claims['LocationName'];
    if (rawName) return String(rawName);

    if (tokenSites.length > 0 && tokenSites[0].name) {
      return tokenSites[0].name;
    }

    return selectedSid ? (selectedSid.length > 8 ? `Site (${selectedSid.slice(0, 8)})` : selectedSid) : 'Main Yard';
  });

  public readonly userInitials = computed<string>(() => {
    const name = this.userName().trim();
    if (!name) return 'US';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  /**
   * Authenticates user via POST /api/auth/login
   */
  public login(userName: string, password: string): Observable<void> {
    this.loading.set(true);
    const payload: LoginRequest = {
      UserName: userName,
      Password: password,
    };

    return this.http.post<LoginResponse | string>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      map((response) => {
        let token = '';
        let refreshToken = '';

        if (typeof response === 'string') {
          token = response;
        } else if (response && typeof response === 'object') {
          const data = (response as any).data ?? (response as any).result ?? response;
          token =
            data.accessToken ??
            data.token ??
            data.jwtToken ??
            data.AccessToken ??
            data.Token ??
            data.JwtToken ??
            (typeof data === 'string' ? data : '');
          refreshToken = data.refreshToken ?? data.RefreshToken ?? '';
        }

        if (!token) {
          throw new Error('Login response did not contain an access token.');
        }

        sessionStorage.setItem(this.tokenKey, token);
        sessionStorage.removeItem(this.explicitLogoutKey);
        if (refreshToken) {
          sessionStorage.setItem(this.refreshTokenKey, refreshToken);
        }

        this.authenticated.set(true);
        const claims = this.decodeToken(token);
        this.userClaims.set(claims);
        this.initContextFromToken(claims);
        this.loadMySites();
        this.loadMyModules();
      }),
      map(() => undefined),
      finalize(() => this.loading.set(false)),
    );
  }

  /**
   * Switches active client/site context via POST /api/auth/context
   * and saves the updated JWT token for all subsequent requests.
   */
  public switchContext(clientId: string, siteId?: string): Observable<string> {
    this.contextLoading.set(true);
    const payload: ContextRequest = {
      ClientId: clientId,
      SiteId: siteId || null,
    };

    return this.http.post<LoginResponse | string>(`${this.apiBaseUrl}/auth/context`, payload).pipe(
      map((response) => {
        let newToken = '';
        if (typeof response === 'string') {
          newToken = response;
        } else if (response && typeof response === 'object') {
          const data = (response as any).data ?? (response as any).result ?? response;
          newToken =
            data.accessToken ??
            data.token ??
            data.jwtToken ??
            data.AccessToken ??
            data.Token ??
            data.JwtToken ??
            (typeof data === 'string' ? data : '');
        }

        if (newToken) {
          sessionStorage.setItem(this.tokenKey, newToken);
          this.userClaims.set(this.decodeToken(newToken));
        }

        if (clientId) {
          sessionStorage.setItem(this.clientContextKey, clientId);
          this.selectedClientId.set(clientId);
        }
        if (siteId) {
          sessionStorage.setItem(this.siteContextKey, siteId);
          this.selectedSiteId.set(siteId);
        } else {
          sessionStorage.removeItem(this.siteContextKey);
          this.selectedSiteId.set('');
        }

        this.loadMyModules();
        return newToken;
      }),
      finalize(() => this.contextLoading.set(false)),
    );
  }

  /**
   * Retrieves current user profile from GET /api/auth/me
   */
  public getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/auth/me`);
  }

  /**
   * Retrieves current user's accessible sites from GET /api/auth/me/sites
   */
  public getMySites(): Observable<UserSiteDto[]> {
    return this.http.get<UserSiteDto[]>(`${this.apiBaseUrl}/auth/me/sites`);
  }

  /**
   * Retrieves current user's permissions from GET /api/auth/me/permissions
   */
  public getMyPermissions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiBaseUrl}/auth/me/permissions`);
  }

  /**
   * Retrieves current user's authorized navigation modules from GET /api/auth/me/modules
   */
  public getMyModules(): Observable<NavigationModuleDto[]> {
    return this.http.get<any>(`${this.apiBaseUrl}/auth/me/modules`).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        if (res && Array.isArray(res.value)) return res.value;
        return this.generateDefaultModules();
      }),
    );
  }

  /**
   * Loads current user's navigation modules into sidebarModules signal with fallback
   */
  public loadMyModules(): void {
    if (!this.authenticated()) return;
    if (this.isBypassMode()) {
      this.sidebarModules.set(this.generateDefaultModules());
      return;
    }
    this.getMyModules()
      .pipe(catchError(() => of(this.generateDefaultModules())))
      .subscribe({
        next: (modules) => {
          if (modules && modules.length > 0) {
            this.sidebarModules.set(modules);
          } else {
            this.sidebarModules.set(this.generateDefaultModules());
          }
        },
      });
  }

  public generateDefaultModules(): NavigationModuleDto[] {
    const isSys = this.isSystemAdmin();
    const isClient = this.isClientAdmin();
    const isSite = this.isSiteAdmin();

    const modules: NavigationModuleDto[] = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        transKey: 'NAV.DASHBOARD',
        icon: 'dashboard',
        route: '/dashboard',
        order: 1,
      },
      {
        id: 'gate-events',
        title: 'Gate Events',
        transKey: 'NAV.GATE_EVENTS',
        icon: 'sensor_occupied',
        route: '/gate-events',
        order: 2,
        children: [
          {
            id: 'gate-in',
            title: 'Gate In',
            transKey: 'NAV.GATE_IN',
            icon: 'login',
            route: '/gate-events/in',
            order: 1,
          },
          {
            id: 'gate-out',
            title: 'Gate Out',
            transKey: 'NAV.GATE_OUT',
            icon: 'logout',
            route: '/gate-events/out',
            order: 2,
          },
        ],
      },
      { id: 'tasks', title: 'Tasks', transKey: 'NAV.TASKS', icon: 'task_alt', route: '/tasks', order: 3 },
      {
        id: 'inventory',
        title: 'Inventory',
        transKey: 'NAV.INVENTORY',
        icon: 'inventory_2',
        route: '/inventory',
        order: 4,
      },
      { id: 'reports', title: 'Reports', transKey: 'NAV.REPORTS', icon: 'bar_chart', route: '/reports', order: 5 },
      { id: 'alerts', title: 'Alerts', transKey: 'NAV.ALERTS', icon: 'shield', route: '/alerts', order: 6 },
    ];

    if (isSys || isClient) {
      modules.push({
        id: 'admin',
        title: 'Admin',
        transKey: 'NAV.ADMIN',
        icon: 'settings',
        route: '/admin',
        order: 7,
        children: [
          { id: 'clients', title: 'Clients', transKey: 'NAV.CLIENTS', icon: 'business', route: '/clients', order: 1 },
          { id: 'sites', title: 'Sites', transKey: 'NAV.SITES', icon: 'location_on', route: '/sites', order: 2 },
          { id: 'users', title: 'Users', transKey: 'NAV.USERS', icon: 'people', route: '/users', order: 3 },
          {
            id: 'roles',
            title: 'Roles',
            transKey: 'NAV.ROLES',
            icon: 'admin_panel_settings',
            route: '/roles',
            order: 4,
          },
        ],
      });
    } else if (isSite) {
      modules.push({
        id: 'admin',
        title: 'Admin',
        transKey: 'NAV.ADMIN',
        icon: 'settings',
        route: '/admin',
        order: 7,
        children: [
          { id: 'sites', title: 'Sites', transKey: 'NAV.SITES', icon: 'location_on', route: '/sites', order: 1 },
          { id: 'users', title: 'Users', transKey: 'NAV.USERS', icon: 'people', route: '/users', order: 2 },
          {
            id: 'roles',
            title: 'Roles',
            transKey: 'NAV.ROLES',
            icon: 'admin_panel_settings',
            route: '/roles',
            order: 3,
          },
        ],
      });
    }

    return modules;
  }

  /**
   * Refreshes active JWT token via POST /api/auth/refresh
   */
  public refreshSession(): Observable<string> {
    const refreshToken = sessionStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available.'));
    }

    const payload: RefreshRequest = { RefreshToken: refreshToken };
    return this.http.post<LoginResponse | string>(`${this.apiBaseUrl}/auth/refresh`, payload).pipe(
      map((response) => {
        let token = '';
        if (typeof response === 'string') {
          token = response;
        } else if (response) {
          const data = (response as any).data ?? (response as any).result ?? response;
          token = data.accessToken ?? data.token ?? data.AccessToken ?? data.Token ?? '';
        }
        if (token) {
          sessionStorage.setItem(this.tokenKey, token);
          this.userClaims.set(this.decodeToken(token));
        }
        return token;
      }),
    );
  }

  /**
   * Changes user password via POST /api/auth/change-password
   */
  public changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/auth/change-password`, request);
  }

  public triggerSessionExpired(): void {
    if (this.authenticated() && !this.isBypassMode()) {
      this.sessionExpired.set(true);
    }
  }

  public handleSessionLogout(): void {
    this.sessionExpired.set(false);
    this.logout();
  }

  public isTokenExpired(): boolean {
    const claims = this.userClaims() ?? this.getDecodedToken();
    if (!claims || !claims.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return claims.exp < now;
  }

  public logout(): void {
    this.sessionExpired.set(false);
    // Best effort API notification
    this.http
      .post(`${this.apiBaseUrl}/auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();

    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.clientContextKey);
    sessionStorage.removeItem(this.siteContextKey);
    sessionStorage.setItem(this.explicitLogoutKey, 'true');
    this.authenticated.set(false);
    this.userClaims.set(null);
    this.selectedClientId.set('');
    this.selectedSiteId.set('');
    void this.router.navigate(['/login']);
  }

  public getActiveClientId(): string {
    const selected = this.selectedClientId();
    if (selected) return selected;

    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.clientContextKey) : null;
    if (stored) return stored;

    const claims = this.userClaims() ?? this.getDecodedToken();
    if (claims) {
      const cid =
        claims['client_ids'] ??
        claims['ClientId'] ??
        claims['clientId'] ??
        claims['client_id'] ??
        claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/client'];
      if (cid) {
        return Array.isArray(cid) ? String(cid[0]) : String(cid).split(',')[0].trim();
      }

      const clients = this.tokenClients();
      if (clients.length > 0 && clients[0].id) {
        return clients[0].id;
      }
    }

    return '';
  }

  public getActiveSiteId(): string {
    const selected = this.selectedSiteId();
    if (selected) return selected;

    const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.siteContextKey) : null;
    if (stored) return stored;

    const claims = this.userClaims() ?? this.getDecodedToken();
    if (claims) {
      const sid =
        claims['site_ids'] ??
        claims['SiteId'] ??
        claims['siteId'] ??
        claims['site_id'] ??
        claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/site'];
      if (sid) {
        return Array.isArray(sid) ? String(sid[0]) : String(sid).split(',')[0].trim();
      }

      const sites = this.tokenSites();
      if (sites.length > 0 && (sites[0].siteId || sites[0].id)) {
        return sites[0].siteId || sites[0].id;
      }
    }

    return '';
  }

  public getUserId(): string {
    const claims = this.userClaims() ?? this.getDecodedToken();
    if (!claims) return '';
    const uid =
      claims['sub'] ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid'] ??
      claims['nameid'] ??
      claims['user_id'] ??
      claims['userId'] ??
      claims['UserId'] ??
      claims['id'] ??
      claims['Id'];
    return uid ? String(uid).trim() : '';
  }

  public bypassLogin(role: string = 'SystemAdmin'): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.explicitLogoutKey);
    }

    const mockClaims: Record<string, any> = {
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/name': 'Admin User',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': role,
      name: 'Admin User',
      role: role,
      roles: [role],
      email: 'admin@sarweshwar.com',
      ClientId: '01a07f00-0000-0000-0000-000000000001',
      ClientName: 'Prosper Logistics Corp',
      SiteId: '01a07f00-0000-0000-0000-000000000011',
      SiteName: 'Nhava Sheva Terminal (JNPT)',
      clients: [
        { id: '01a07f00-0000-0000-0000-000000000001', name: 'Prosper Logistics Corp', code: 'PLC' },
        { id: '01a07f00-0000-0000-0000-000000000002', name: 'Oceanic Freight Systems', code: 'OFS' },
        { id: '01a07f00-0000-0000-0000-000000000003', name: 'Global Port Terminals', code: 'GPT' },
      ],
      sites: [
        {
          id: '01a07f00-0000-0000-0000-000000000011',
          name: 'Nhava Sheva Terminal (JNPT)',
          code: 'JNPT-01',
          clientId: '01a07f00-0000-0000-0000-000000000001',
        },
        {
          id: '01a07f00-0000-0000-0000-000000000012',
          name: 'Mundra CFS Yard',
          code: 'MUN-CFS',
          clientId: '01a07f00-0000-0000-0000-000000000001',
        },
        {
          id: '01a07f00-0000-0000-0000-000000000013',
          name: 'Chennai Port Yard A',
          code: 'MAA-01',
          clientId: '01a07f00-0000-0000-0000-000000000002',
        },
        {
          id: '01a07f00-0000-0000-0000-000000000014',
          name: 'Kolkata Dock Inland',
          code: 'CCU-02',
          clientId: '01a07f00-0000-0000-0000-000000000003',
        },
      ],
      exp: 253402300799,
    };

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(mockClaims));
    const mockToken = `${header}.${payload}.mockSignature`;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, mockToken);
      sessionStorage.setItem(this.clientContextKey, '01a07f00-0000-0000-0000-000000000001');
      sessionStorage.setItem(this.siteContextKey, '01a07f00-0000-0000-0000-000000000011');
    }

    this.authenticated.set(true);
    this.userClaims.set(mockClaims);
    this.selectedClientId.set('01a07f00-0000-0000-0000-000000000001');
    this.selectedSiteId.set('01a07f00-0000-0000-0000-000000000011');
    this.loadMyModules();
  }

  public isBypassMode(): boolean {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.tokenKey) : null;
    return Boolean(token && token.endsWith('.mockSignature'));
  }

  private initContextFromToken(claims: any = this.userClaims()): void {
    if (!claims) return;
    if (!this.selectedClientId()) {
      const cid = claims['client_ids'] ?? claims['ClientId'] ?? claims['clientId'] ?? claims['client_id'];
      let idStr = '';
      if (cid) {
        idStr = Array.isArray(cid) ? String(cid[0]) : String(cid).split(',')[0].trim();
      }
      if (!idStr) {
        const clients = this.tokenClients();
        if (clients.length > 0 && clients[0].id) {
          idStr = clients[0].id;
        }
      }
      if (idStr) {
        this.selectedClientId.set(idStr);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.clientContextKey, idStr);
        }
      }
    }
    if (!this.selectedSiteId()) {
      const sid = claims['site_ids'] ?? claims['SiteId'] ?? claims['siteId'] ?? claims['site_id'];
      let idStr = '';
      if (sid) {
        idStr = Array.isArray(sid) ? String(sid[0]) : String(sid).split(',')[0].trim();
      }
      if (!idStr) {
        const sites = this.tokenSites();
        if (sites.length > 0 && (sites[0].siteId || sites[0].id)) {
          idStr = sites[0].siteId || sites[0].id;
        }
      }
      if (idStr) {
        this.selectedSiteId.set(idStr);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.siteContextKey, idStr);
        }
      }
    }
  }

  private getDecodedToken(): any {
    if (typeof sessionStorage === 'undefined') return null;
    const token = sessionStorage.getItem(this.tokenKey);
    return token ? this.decodeToken(token) : null;
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
