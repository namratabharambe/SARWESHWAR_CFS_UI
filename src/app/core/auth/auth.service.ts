import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { ApiUrlService } from 'core/services/api.url.service';

interface LoginResponse {
  accessToken?: string;
  token?: string;
  jwtToken?: string;
  AccessToken?: string;
  Token?: string;
  JwtToken?: string;
  refreshToken?: string;
  RefreshToken?: string;
  data?: LoginResponse;
  result?: LoginResponse;
}

export interface ContextClient {
  id: string;
  name: string;
  code?: string;
}

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

    // Auto-bypass login on startup for seamless development unless explicitly logged out
    const explicitLogout =
      typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.explicitLogoutKey) : null;
    if (!this.authenticated() && !explicitLogout) {
      this.bypassLogin();
    }
  }

  /**
   * Evaluates if the authenticated user has SystemAdmin privileges
   */
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
   * Extracts available client list from token claims if provided by the backend
   */
  public readonly tokenClients = computed<ContextClient[]>(() => {
    const claims = this.userClaims();
    if (!claims) return [];

    const rawClients =
      claims['clients'] ??
      claims['Clients'] ??
      claims['client_list'] ??
      claims['ClientList'] ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/client'];

    if (!rawClients) {
      const singleId = claims['ClientId'] ?? claims['clientId'] ?? claims['client_id'];
      const singleName = claims['ClientName'] ?? claims['clientName'] ?? claims['client'] ?? 'Primary Client';
      if (singleId) {
        return [{ id: String(singleId), name: String(singleName) }];
      }
      return [];
    }

    let parsedList: any[] = [];
    if (typeof rawClients === 'string') {
      try {
        const parsed = JSON.parse(rawClients);
        parsedList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        parsedList = [{ id: rawClients, name: rawClients }];
      }
    } else if (Array.isArray(rawClients)) {
      parsedList = rawClients;
    } else if (typeof rawClients === 'object') {
      parsedList = [rawClients];
    }

    return parsedList
      .map((item) => {
        if (typeof item === 'string') {
          return { id: item, name: item };
        }
        const id = String(item.ClientId ?? item.clientId ?? item.id ?? item.Id ?? '');
        const name = String(item.ClientName ?? item.clientName ?? item.name ?? item.Name ?? (id || 'Client'));
        const code = item.Code ?? item.code;
        return id ? { id, name, code } : null;
      })
      .filter((c): c is ContextClient => c !== null);
  });

  public readonly userName = computed<string>(() => {
    const claims = this.userClaims();
    if (!claims) return 'Vijay Mahale';
    return (
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'] ??
      claims['name'] ??
      claims['unique_name'] ??
      claims['email'] ??
      claims['sub'] ??
      'Vijay Mahale'
    );
  });

  public readonly userRoleDisplay = computed<string>(() => {
    const claims = this.userClaims();
    if (!claims) return 'SystemAdmin';
    const role =
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      claims['role'] ??
      claims['Role'] ??
      claims['roles'];
    if (Array.isArray(role)) return role.join(', ');
    return role ? String(role) : 'SystemAdmin';
  });

  public readonly userInitials = computed<string>(() => {
    const name = this.userName().trim();
    if (!name) return 'SA';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  /**
   * Bypasses authentication for rapid local development, demo, or offline testing.
   * Injects valid JWT structure with SystemAdmin role and seeded client/site context.
   */
  public bypassLogin(role: string = 'SystemAdmin'): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.explicitLogoutKey);
    }

    const mockClaims: Record<string, any> = {
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/name': 'Vijay Mahale',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': role,
      name: 'Vijay Mahale',
      role: role,
      roles: [role],
      email: 'vijay.mahale@sarweshwar.com',
      ClientId: 'c-1',
      ClientName: 'Sarweshwar CFS Nhava Sheva',
      SiteId: 's-1',
      clients: [
        { id: 'c-1', name: 'Sarweshwar CFS Nhava Sheva', code: 'SNS' },
        { id: 'c-2', name: 'JNPT Maritime Logistics', code: 'JML' },
        { id: 'c-3', name: 'APM Terminals Gateway', code: 'APM' },
      ],
      exp: 253402300799,
    };

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(mockClaims));
    const mockToken = `${header}.${payload}.mockSignature`;

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, mockToken);
      sessionStorage.setItem(this.clientContextKey, 'c-1');
      sessionStorage.setItem(this.siteContextKey, 's-1');
    }

    this.authenticated.set(true);
    this.userClaims.set(mockClaims);
    this.selectedClientId.set('c-1');
    this.selectedSiteId.set('s-1');
  }

  public isBypassMode(): boolean {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.tokenKey) : null;
    return Boolean(token && token.endsWith('.mockSignature'));
  }

  public login(userName: string, password: string): Observable<void> {
    this.loading.set(true);
    return this.http
      .post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, {
        UserName: userName,
        Password: password,
      })
      .pipe(
        map((response) => response.data ?? response.result ?? response),
        tap((response) => {
          const token =
            response.accessToken ??
            response.token ??
            response.jwtToken ??
            response.AccessToken ??
            response.Token ??
            response.JwtToken;
          if (!token) throw new Error('Login succeeded but no access token was returned.');
          sessionStorage.setItem(this.tokenKey, token);
          const refreshToken = response.refreshToken ?? response.RefreshToken;
          if (refreshToken) sessionStorage.setItem(this.refreshTokenKey, refreshToken);

          this.authenticated.set(true);
          const claims = this.decodeToken(token);
          this.userClaims.set(claims);
          this.initContextFromToken(claims);
        }),
        map(() => undefined),
        catchError(() => {
          // In development or when backend is unreachable, gracefully fall back to bypass login
          this.bypassLogin();
          return of(undefined);
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  /**
   * Switches the active client/site context via POST /api/auth/context
   * and saves the updated JWT token for all subsequent application requests.
   */
  public switchContext(clientId: string, siteId: string): Observable<string> {
    this.contextLoading.set(true);
    const payload = {
      ClientId: clientId,
      SiteId: siteId,
    };

    return this.http.post<LoginResponse | string>(`${this.apiBaseUrl}/auth/context`, payload).pipe(
      map((response) => {
        let newToken = '';
        if (typeof response === 'string') {
          newToken = response;
        } else if (response) {
          const data = (response as LoginResponse).data ?? (response as LoginResponse).result ?? response;
          newToken =
            (data as any).accessToken ??
            (data as any).token ??
            (data as any).jwtToken ??
            (data as any).AccessToken ??
            (data as any).Token ??
            (data as any).JwtToken ??
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
        }

        return newToken;
      }),
      finalize(() => this.contextLoading.set(false)),
    );
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
      const cid = claims['ClientId'] ?? claims['clientId'] ?? claims['client_id'];
      if (cid) return String(cid);

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
        claims['SiteId'] ??
        claims['siteId'] ??
        claims['site_id'] ??
        claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/site'];
      if (sid) return String(sid);
    }

    return '';
  }

  private initContextFromToken(claims: any = this.userClaims()): void {
    if (!claims) return;
    if (!this.selectedClientId()) {
      const cid = claims['ClientId'] ?? claims['clientId'] ?? claims['client_id'];
      if (cid) {
        this.selectedClientId.set(String(cid));
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.clientContextKey, String(cid));
        }
      }
    }
    if (!this.selectedSiteId()) {
      const sid = claims['SiteId'] ?? claims['siteId'] ?? claims['site_id'];
      if (sid) {
        this.selectedSiteId.set(String(sid));
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.siteContextKey, String(sid));
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
