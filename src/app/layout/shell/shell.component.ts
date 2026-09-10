import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, ContextClient } from 'core/auth/auth.service';
import { AdminRepository } from 'core/data/admin.repository';
import { Site } from 'core/models/admin.models';
import { ThemeService } from 'core/services/theme.service';
import { LocalizationService, SupportedLanguage } from 'core/services/localization.service';
import { AvatarComponent } from 'shared/components/atoms/avatar/avatar.component';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent, TranslatePipe],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  public readonly auth = inject(AuthService);
  public readonly repository = inject(AdminRepository);
  public readonly theme = inject(ThemeService);
  public readonly localization = inject(LocalizationService);
  private readonly router = inject(Router);

  public readonly collapsed = signal<boolean>(false);
  public readonly mobileOpen = signal<boolean>(false);
  public readonly adminExpanded = signal<boolean>(true);
  public readonly currentUrl = signal<string>(this.router.url);

  public readonly sitesForSelectedClient = signal<Site[]>([]);
  public readonly loadingSites = signal<boolean>(false);
  public readonly switchingContext = signal<boolean>(false);
  public readonly contextToast = signal<string>('');

  public readonly availableClients = computed<ContextClient[]>(() => {
    const fromRepo = this.repository.clients();
    const fromToken = this.auth.tokenClients();

    const clientMap = new Map<string, ContextClient>();

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

    return Array.from(clientMap.values());
  });

  public readonly currentClientName = computed<string>(() => {
    const cid = this.auth.selectedClientId();
    if (!cid) return 'Select Client';
    const found = this.availableClients().find((c) => c.id === cid);
    return found ? found.name : cid;
  });

  public readonly currentSiteName = computed<string>(() => {
    const sid = this.auth.selectedSiteId();
    if (!sid) return 'Select Site';
    const found = this.sitesForSelectedClient().find((s) => s.id === sid);
    return found ? found.name : sid;
  });

  constructor() {
    this.repository.loadAll();
    this.repository.loadClients();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        if (this.isAdminRoute(event.urlAfterRedirects)) {
          this.adminExpanded.set(true);
        }
      });

    effect(() => {
      const clients = this.availableClients();
      const currentCid = this.auth.selectedClientId();

      if (!currentCid && clients.length > 0) {
        const firstClientId = clients[0].id;
        this.auth.selectedClientId.set(firstClientId);
        this.loadSitesForClient(firstClientId, true);
      } else if (currentCid) {
        this.loadSitesForClient(currentCid, false);
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
    this.loadSitesForClient(clientId, true);
  }

  public onSiteSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const siteId = target.value;
    const clientId = this.auth.selectedClientId();

    if (!siteId || !clientId) return;
    this.performContextSwitch(clientId, siteId);
  }

  private loadSitesForClient(clientId: string, autoSwitchIfMissingSite: boolean): void {
    if (!clientId) return;
    this.loadingSites.set(true);

    this.repository.getSitesByClientId(clientId).subscribe({
      next: (sites) => {
        this.sitesForSelectedClient.set(sites);
        this.loadingSites.set(false);

        const currentSid = this.auth.selectedSiteId();
        const siteExists = sites.some((s) => s.id === currentSid);

        if (!siteExists && sites.length > 0) {
          const defaultSiteId = sites[0].id;
          this.auth.selectedSiteId.set(defaultSiteId);
          if (autoSwitchIfMissingSite) {
            this.performContextSwitch(clientId, defaultSiteId);
          }
        } else if (siteExists && autoSwitchIfMissingSite) {
          this.performContextSwitch(clientId, currentSid);
        }
      },
      error: () => {
        this.loadingSites.set(false);
      },
    });
  }

  private performContextSwitch(clientId: string, siteId: string): void {
    this.switchingContext.set(true);
    this.auth.switchContext(clientId, siteId).subscribe({
      next: () => {
        this.switchingContext.set(false);
        this.showToast('Context updated successfully');
        this.repository.loadAll();
      },
      error: () => {
        this.switchingContext.set(false);
        this.showToast('Failed to switch context');
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
