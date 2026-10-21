import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from './services/dashboard.service';
import { AuthService, ContextClient } from 'core/auth/auth.service';
import { AdminRepository, matchIds } from 'core/data/admin.repository';
import { InventoryService } from 'shared/services/inventory.service';
import { Site } from 'shared/types/admin/admin.interface';
import { KpiMetricCardComponent } from './components/kpi-metric-card/kpi-metric-card.component';
import { RecentGateActivityComponent } from './components/recent-gate-activity/recent-gate-activity.component';
import { YardCapacityUtilizationComponent } from './components/yard-capacity-utilization/yard-capacity-utilization.component';
import { YardOverviewComponent } from './components/yard-overview/yard-overview.component';
import { NeedsAttentionComponent } from './components/needs-attention/needs-attention.component';
import { GatePerformanceComponent } from './components/gate-performance/gate-performance.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    KpiMetricCardComponent,
    YardOverviewComponent,
    RecentGateActivityComponent,
    YardCapacityUtilizationComponent,
    NeedsAttentionComponent,
    GatePerformanceComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  public readonly dashboardService = inject(DashboardService);
  public readonly auth = inject(AuthService);
  public readonly repository = inject(AdminRepository);
  public readonly inventoryService = inject(InventoryService);

  @HostListener('window:keydown.escape')
  public onEscKey(): void {
    if (this.dashboardService.selectedGateActivity()) {
      this.dashboardService.closeActivityPreview();
    }
  }

  // Re-stamps whenever a fresh batch of gate activity arrives.
  public readonly lastUpdated = computed<string>(() => {
    this.dashboardService.filteredGateActivities();
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  public refresh(): void {
    this.dashboardService.loadGateActivities(this.effectiveSelectedSiteId(), this.effectiveSelectedClientId());
  }

  public switchingContext = signal<boolean>(false);
  public readonly contextSuccessMessage = signal<string>('');

  public readonly availableClients = this.repository.availableClients;
  public readonly sitesForSelectedClient = this.repository.sitesForSelectedClient;

  public readonly canSwitchContext = computed<boolean>(() => {
    return this.auth.isSystemAdmin() || this.auth.isClientAdmin() || this.auth.isSiteAdmin();
  });

  public readonly canSelectClient = computed<boolean>(() => {
    return this.auth.isSystemAdmin() || (this.auth.isClientAdmin() && this.availableClients().length > 1);
  });

  public readonly canSelectSite = computed<boolean>(() => {
    return (
      this.auth.isSystemAdmin() ||
      this.auth.isClientAdmin() ||
      this.auth.isSiteAdmin()
    );
  });

  public readonly hasMultipleAccess = computed<boolean>(() => {
    return (
      this.canSwitchContext() &&
      (this.availableClients().length > 1 || this.sitesForSelectedClient().length > 1 || this.auth.isSystemAdmin())
    );
  });

  public readonly effectiveSelectedClientId = computed<string>(() => {
    return this.auth.selectedClientId() || this.auth.getActiveClientId();
  });

  public readonly effectiveSelectedSiteId = computed<string>(() => {
    const sid = this.auth.selectedSiteId();
    const sites = this.sitesForSelectedClient();
    if (sid && sites.some((s) => matchIds(s.id, sid) || s.id === sid)) {
      return sid;
    }
    return sites.length > 0 ? sites[0].id : '';
  });

  public readonly clientName = computed<string>(() => {
    const raw = this.auth.clientName();
    if (raw && raw !== 'Primary Client') return raw;
    const site = this.auth.siteName();
    if (site && site.toLowerCase().includes('sarveshwar')) return 'Sarveshwar Logistics';
    return raw || 'Sarveshwar Logistics';
  });

  public readonly siteName = computed<string>(() => {
    return this.auth.siteName() || 'Sarveshwar Panvel';
  });

  public onClientChange(eventOrValue: Event | string): void {
    const clientId = typeof eventOrValue === 'string' ? eventOrValue : (eventOrValue.target as HTMLSelectElement).value;
    if (!clientId) return;

    this.switchingContext.set(true);
    this.repository.getSitesByClientId(clientId).subscribe({
      next: (sites) => {
        const availableSites = sites.length > 0 ? sites : this.sitesForSelectedClient();
        const targetSiteId = availableSites.length > 0 ? availableSites[0].id : '';

        this.performSwitch(clientId, targetSiteId);
      },
      error: () => {
        const localSites = this.sitesForSelectedClient();
        const targetSiteId = localSites.length > 0 ? localSites[0].id : '';
        this.performSwitch(clientId, targetSiteId);
      },
    });
  }

  public onSiteChange(eventOrValue: Event | string): void {
    const siteId = typeof eventOrValue === 'string' ? eventOrValue : (eventOrValue.target as HTMLSelectElement).value;
    const clientId = this.effectiveSelectedClientId();
    if (!siteId) return;

    this.switchingContext.set(true);
    this.performSwitch(clientId, siteId);
  }

  private performSwitch(clientId: string, siteId: string): void {
    this.auth.switchContext(clientId, siteId).subscribe({
      next: () => {
        this.finishContextSwitch(clientId, siteId);
      },
      error: () => {
        this.finishContextSwitch(clientId, siteId);
      },
    });
  }

  private finishContextSwitch(clientId: string, siteId: string): void {
    this.switchingContext.set(false);
    this.showContextToast('Context updated');
    this.repository.loadAll(clientId, siteId);
    this.dashboardService.loadGateActivities(siteId, clientId);
    this.inventoryService.loadLiveGateData(this.inventoryService.activeGateMode());
  }

  private showContextToast(msg: string): void {
    this.contextSuccessMessage.set(msg);
    setTimeout(() => {
      if (this.contextSuccessMessage() === msg) {
        this.contextSuccessMessage.set('');
      }
    }, 3500);
  }
}

