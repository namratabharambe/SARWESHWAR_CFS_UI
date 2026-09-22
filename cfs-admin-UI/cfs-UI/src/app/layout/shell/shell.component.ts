import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, ContextClient } from 'core/auth/auth.service';
import { AdminRepository, matchIds } from 'core/data/admin.repository';
import { Site } from 'core/models/admin.models';
import { ThemeService } from 'core/services/theme.service';
import { LocalizationService, SupportedLanguage } from 'core/services/localization.service';
import { DashboardService } from 'app/features/dashboard/services/dashboard.service';


@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ShellComponent {
  public readonly auth = inject(AuthService);
  public readonly repository = inject(AdminRepository);
  public readonly theme = inject(ThemeService);
  public readonly localization = inject(LocalizationService);
  public readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  public readonly collapsed = signal<boolean>(false);
  public readonly mobileOpen = signal<boolean>(false);
  public readonly adminExpanded = signal<boolean>(true);
  public readonly currentUrl = signal<string>(this.router.url);

  public readonly sitesForSelectedClient = computed<Site[]>(() => {
    const selectedCid = this.auth.selectedClientId() || this.auth.getActiveClientId();
    const tokenSites = this.auth.tokenSites();
    const repoSites = this.repository.sites();
    const isSysAdmin = this.auth.isSystemAdmin();

    const siteMap = new Map<string, Site>();

    if (isSysAdmin) {
      // 1. From repository sites belonging strictly to the selected client
      for (const s of repoSites) {
        if (!s.id) continue;
        if (!selectedCid || matchIds(s.clientId, selectedCid) || s.clientId === selectedCid) {
          siteMap.set(s.id, { ...s });
        }
      }

      // 2. From token sites belonging strictly to the selected client
      for (const ts of tokenSites) {
        const id = (ts.id || ts.siteId || '').trim();
        if (!id) continue;
        if (!selectedCid || !ts.clientId || matchIds(ts.clientId, selectedCid) || ts.clientId === selectedCid) {
          const existing = siteMap.get(id);
          if (!existing) {
            siteMap.set(id, {
              id,
              clientId: ts.clientId || selectedCid,
              name: ts.name || `Site (${id.slice(0, 8)})`,
              code: ts.code || '',
              status: 'Active',
              active: true,
              isActive: true,
            });
          } else if ((!existing.name || existing.name.startsWith('Site (')) && ts.name && !ts.name.startsWith('Site (')) {
            existing.name = ts.name;
          }
        }
      }
    } else {
      // Non-System Admin (ClientAdmin, SiteAdmin, Operator, User):
      // MUST ONLY show sites authorized in the login token / getMySites!
      for (const ts of tokenSites) {
        const id = (ts.id || ts.siteId || '').trim();
        if (!id) continue;

        // Strictly filter to the selected client
        if (selectedCid && ts.clientId && !matchIds(ts.clientId, selectedCid) && ts.clientId !== selectedCid) {
          continue;
        }

        const repoMatch = repoSites.find((r) => r.id === id || matchIds(r.id, id));
        const displayName =
          repoMatch && repoMatch.name && !repoMatch.name.startsWith('Site (')
            ? repoMatch.name
            : ts.name || `Site (${id.slice(0, 8)})`;

        siteMap.set(id, {
          id,
          clientId: ts.clientId || repoMatch?.clientId || selectedCid,
          name: displayName,
          code: ts.code || repoMatch?.code || '',
          status: 'Active',
          active: true,
          isActive: true,
        });
      }
    }

    return Array.from(siteMap.values());
  });

  public readonly loadingSites = signal<boolean>(false);
  public readonly switchingContext = signal<boolean>(false);
  public readonly contextToast = signal<string>('');
  public readonly notificationCount = signal<number>(8);

  public readonly availableClients = computed<ContextClient[]>(() => {
    const isSysAdmin = this.auth.isSystemAdmin();
    const fromRepo = this.repository.clients();
    const fromToken = this.auth.tokenClients();

    const clientMap = new Map<string, ContextClient>();

    if (isSysAdmin) {
      for (const c of fromRepo) {
        if (c.id) {
          clientMap.set(c.id, {
            id: c.id,
            name: c.clientName || c.name || 'Client',
            code: c.code,
          });
        }
      }
      for (const c of fromToken) {
        if (c.id && !clientMap.has(c.id)) {
          clientMap.set(c.id, c);
        }
      }
    } else {
      // Non-SystemAdmin: ONLY clients authorized in the token
      for (const c of fromToken) {
        if (c.id) {
          const repoMatch = fromRepo.find((r) => r.id === c.id || matchIds(r.id, c.id));
          const name =
            repoMatch && (repoMatch.clientName || repoMatch.name) && repoMatch.clientName !== 'Primary Client'
              ? repoMatch.clientName || repoMatch.name
              : c.name;
          clientMap.set(c.id, {
            id: c.id,
            name: name || 'Client',
            code: c.code || repoMatch?.code,
          });
        }
      }
    }

    return Array.from(clientMap.values());
  });

  public readonly currentClientName = computed<string>(() => {
    const cid = this.auth.selectedClientId() || this.auth.getActiveClientId();
    if (!cid) return 'Select Client';

    // 1. Check if client exists in availableClients with a real name
    const found = this.availableClients().find((c) => c.id === cid || matchIds(c.id, cid));
    if (found && found.name && found.name !== 'Primary Client' && found.name !== 'Client') {
      return found.name;
    }

    // 2. Check repo clients
    const repoClient = this.repository.clients().find((c) => c.id === cid || matchIds(c.id, cid));
    if (repoClient && (repoClient.clientName || repoClient.name)) {
      const name = repoClient.clientName || repoClient.name;
      if (name && name !== 'Primary Client') return name;
    }

    // 3. Check repo sites for client name
    const repoSites = this.repository.sites();
    for (const s of repoSites) {
      if (s.clientId && matchIds(s.clientId, cid)) {
        const anyS = s as any;
        const siteClientName = anyS.clientName || anyS.ClientName || anyS.client?.name || anyS.client?.clientName;
        if (siteClientName && siteClientName !== 'Primary Client') {
          return siteClientName;
        }
      }
    }

    // 4. Check auth claims
    const claims = this.auth.userClaims();
    if (claims) {
      const claimName =
        claims['ClientName'] ?? claims['clientName'] ?? claims['client'] ?? claims['Company'] ?? claims['company'];
      if (claimName && String(claimName) !== 'Primary Client') return String(claimName);
    }

    if (found && found.name) return found.name;

    return cid.length > 8 ? `Client (${cid.slice(0, 8)})` : cid;
  });

  public readonly currentSiteName = computed<string>(() => {
    const sid = this.effectiveSelectedSiteId();
    if (!sid) return 'Select Site';
    const found = this.sitesForSelectedClient().find((s) => matchIds(s.id, sid) || s.id === sid);
    if (found && found.name && !found.name.startsWith('Site (')) {
      return found.name;
    }
    const repoSite = this.repository.sites().find((s) => matchIds(s.id, sid) || s.id === sid);
    if (repoSite && repoSite.name && !repoSite.name.startsWith('Site (')) {
      return repoSite.name;
    }
    return found ? found.name : sid;
  });

  public readonly effectiveSelectedSiteId = computed<string>(() => {
    const sid = this.auth.selectedSiteId();
    const sites = this.sitesForSelectedClient();
    if (sid && sites.some((s) => matchIds(s.id, sid) || s.id === sid)) {
      return sid;
    }
    return sites.length > 0 ? sites[0].id : '';
  });

  constructor() {
    this.repository.loadAll();
    if (this.auth.canManageClients()) {
      this.repository.loadClients();
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        if (this.isAdminRoute(event.urlAfterRedirects)) {
          this.adminExpanded.set(true);
        }
      });

    // Automatically trigger initial client & site API calls and context switch on initial login
    let hasAutoSwitchedInitialContext = false;
    effect(() => {
      const clients = this.availableClients();
      const storedCid = this.auth.selectedClientId() || this.auth.getActiveClientId();

      if (!hasAutoSwitchedInitialContext && (clients.length > 0 || storedCid)) {
        hasAutoSwitchedInitialContext = true;
        const initialClientId = storedCid || (clients.length > 0 ? clients[0].id : '');
        if (initialClientId) {
          this.auth.selectedClientId.set(initialClientId);
        }

        if (this.auth.isSystemAdmin()) {
          this.loadingSites.set(true);
          this.repository.getSitesByClientId(initialClientId).subscribe({
            next: (sites) => {
              this.loadingSites.set(false);
              const availableSites = sites.filter(
                (s) => matchIds(s.clientId, initialClientId) || s.clientId === initialClientId,
              );
              const initialSiteId = this.auth.selectedSiteId() || (availableSites.length > 0 ? availableSites[0].id : '');
              if (initialSiteId) {
                this.auth.selectedSiteId.set(initialSiteId);
              }
              if (initialClientId) {
                this.performContextSwitch(initialClientId, initialSiteId);
              }
            },
            error: () => {
              this.loadingSites.set(false);
              const fallbackSites = this.sitesForSelectedClient();
              const fallbackSiteId = this.auth.selectedSiteId() || (fallbackSites.length > 0 ? fallbackSites[0].id : '');
              if (fallbackSiteId) {
                this.auth.selectedSiteId.set(fallbackSiteId);
              }
              if (initialClientId) {
                this.performContextSwitch(initialClientId, fallbackSiteId);
              }
            },
          });
        } else {
          // Non-SystemAdmin
          const availableSites = this.sitesForSelectedClient();
          const initialSiteId = this.auth.selectedSiteId() || (availableSites.length > 0 ? availableSites[0].id : '');
          if (initialSiteId) {
            this.auth.selectedSiteId.set(initialSiteId);
          }
          if (initialClientId) {
            this.performContextSwitch(initialClientId, initialSiteId);
          }
        }
      }
    });
  }

  public isAdminRoute(url: string = this.currentUrl()): boolean {
    return url.includes('/clients') || url.includes('/sites') || url.includes('/users') || url.includes('/roles');
  }

  public toggleAdmin(): void {
    this.adminExpanded.update((v) => !v);
  }

  public onClientSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const clientId = target.value;
    if (!clientId) return;

    this.auth.selectedClientId.set(clientId);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cfs_selected_client_id', clientId);
    }

    if (this.auth.isSystemAdmin()) {
      this.loadingSites.set(true);
      this.repository.getSitesByClientId(clientId).subscribe({
        next: (sites) => {
          this.loadingSites.set(false);
          const availableSites = sites.filter(
            (s) => matchIds(s.clientId, clientId) || s.clientId === clientId,
          );
          const firstSiteId = availableSites.length > 0 ? availableSites[0].id : '';

          if (firstSiteId) {
            this.auth.selectedSiteId.set(firstSiteId);
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('cfs_selected_site_id', firstSiteId);
            }
            this.performContextSwitch(clientId, firstSiteId);
          } else {
            this.auth.selectedSiteId.set('');
            this.performContextSwitch(clientId, '');
          }
        },
        error: () => {
          this.loadingSites.set(false);
          const localSites = this.sitesForSelectedClient();
          const firstSiteId = localSites.length > 0 ? localSites[0].id : '';

          if (firstSiteId) {
            this.auth.selectedSiteId.set(firstSiteId);
            this.performContextSwitch(clientId, firstSiteId);
          } else {
            this.performContextSwitch(clientId, '');
          }
        },
      });
    } else {
      // Non-SystemAdmin: filter token sites for the chosen client
      const availableSites = this.sitesForSelectedClient();
      const firstSiteId = availableSites.length > 0 ? availableSites[0].id : '';

      if (firstSiteId) {
        this.auth.selectedSiteId.set(firstSiteId);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('cfs_selected_site_id', firstSiteId);
        }
        this.performContextSwitch(clientId, firstSiteId);
      } else {
        this.auth.selectedSiteId.set('');
        this.performContextSwitch(clientId, '');
      }
    }
  }


  public onSiteSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const siteId = target.value;
    const clientId = this.auth.getActiveClientId() || this.auth.selectedClientId();

    if (!siteId) return;
    this.auth.selectedSiteId.set(siteId);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('cfs_selected_site_id', siteId);
    }

    if (clientId) {
      this.performContextSwitch(clientId, siteId);
    }
  }

  private performContextSwitch(clientId: string, siteId: string): void {
    this.switchingContext.set(true);
    this.auth.switchContext(clientId, siteId).subscribe({
      next: () => {
        this.switchingContext.set(false);
        this.showToast('Context updated successfully');
        this.repository.loadAll(clientId, siteId);
      },
      error: () => {
        this.switchingContext.set(false);
        this.showToast('Context updated');
      },
    });
  }

  private showToast(msg: string): void {
    this.contextToast.set(msg);
    setTimeout(() => {
      if (this.contextToast() === msg) {
        this.contextToast.set('');
      }
    }, 3000);
  }

  public onLanguageSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.localization.setLanguage(target.value as SupportedLanguage);
    }
  }
}
