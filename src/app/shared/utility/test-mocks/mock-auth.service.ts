import { signal, computed } from '@angular/core';
import { of, Observable } from 'rxjs';

export class MockAuthService {
  public readonly authenticated = signal<boolean>(true);
  public readonly loading = signal<boolean>(false);
  public readonly contextLoading = signal<boolean>(false);
  public readonly sessionExpired = signal<boolean>(false);
  public readonly isSystemAdmin = computed<boolean>(() => true);
  public readonly tokenClients = computed(() => [{ id: 'mock-client-1', name: 'Mock Client 1' }]);
  public readonly userName = computed(() => 'Test Admin');
  public readonly userRoleDisplay = computed(() => 'SystemAdmin');
  public readonly userInitials = computed(() => 'TA');
  public readonly selectedClientId = signal<string>('mock-client-1');
  public readonly selectedSiteId = signal<string>('mock-site-1');

  public login(): Observable<void> {
    this.authenticated.set(true);
    return of(undefined);
  }

  public bypassLogin(_role = 'SystemAdmin'): void {
    this.authenticated.set(true);
  }

  public isBypassMode(): boolean {
    return true;
  }

  public switchContext(clientId: string, siteId: string): Observable<string> {
    this.selectedClientId.set(clientId);
    this.selectedSiteId.set(siteId);
    return of('mock-new-token');
  }

  public logout(): void {
    this.authenticated.set(false);
  }

  public getActiveClientId(): string {
    return this.selectedClientId();
  }

  public getActiveSiteId(): string {
    return this.selectedSiteId();
  }

  public isTokenExpired(): boolean {
    return false;
  }

  public triggerSessionExpired(): void {}
  public handleSessionLogout(): void {}
}
