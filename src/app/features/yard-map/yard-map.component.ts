import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YardMapService } from './yard-map.service';
import { ParkingSlot, ParkingSlotStatus } from './yard-map.models';
import { AuthService } from 'core/auth/auth.service';
import { AdminRepository } from 'core/data/admin.repository';
import * as L from 'leaflet';

interface BlockCluster {
  block: string;
  title: string;
  icon: string;
  color: string;
  centerLat: number;
  centerLng: number;
  totalSlots: number;
  occupiedSlots: number;
}

@Component({
  selector: 'app-yard-map',
  standalone: true,
  imports: [NgClass, DecimalPipe, FormsModule],
  templateUrl: './yard-map.component.html',
  styleUrls: ['./yard-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YardMapComponent implements AfterViewInit, OnDestroy {
  public readonly yardService = inject(YardMapService);
  public readonly auth = inject(AuthService);
  public readonly repository = inject(AdminRepository);

  public readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('leafletMapContainer');

  // Leaflet map instance
  private map: L.Map | null = null;
  private polygonLayerGroup: L.LayerGroup | null = null;
  private markerLayerGroup: L.LayerGroup | null = null;
  private blockBadgeLayerGroup: L.LayerGroup | null = null;
  private highlightCircleGroup: L.LayerGroup | null = null;
  private currentTileLayer: L.TileLayer | null = null;

  // Map layer state
  public readonly activeBaseLayer = signal<'google-hybrid' | 'esri-satellite' | 'google-street'>('google-hybrid');
  public readonly actionToast = signal<string>('');
  public readonly hoveredSlot = signal<ParkingSlot | null>(null);
  public readonly currentZoomLevel = signal<number>(18.5);

  // Dropdown filter signals requested by user
  public readonly filterLocation = signal<string>('');
  public readonly filterContainerNo = signal<string>('');
  public readonly filterCycle = signal<string>('all');
  public readonly selectedTier = signal<number>(1);

  // Master slots from service
  public readonly allSlots = this.yardService.slots;
  public readonly selectedSlot = this.yardService.selectedSlot;

  // Active Tier Dynamic Information (updates when user clicks Tier 1, 2, 3, or 4)
  public readonly activeTierInfo = computed<{
    tier: number;
    tierLabel: string;
    containerNumber: string;
    cycle: string;
    isOccupied: boolean;
    shippingLine?: string;
    isoCode?: string;
    grossWeightKg?: number;
  }>(() => {
    const slot = this.selectedSlot();
    const tier = this.selectedTier();
    if (!slot) {
      return {
        tier: 1,
        tierLabel: 'Tier 1 (Ground Slot)',
        containerNumber: 'No Selection',
        cycle: 'N/A',
        isOccupied: false,
      };
    }

    const maxOccupiedTier = slot.status === 'occupied' ? (slot.tierLevel || 1) : 0;
    const isOccupied = tier <= maxOccupiedTier;
    const tierLabels = ['Ground (Tier 1)', 'Tier 2 (Mid Stack)', 'Tier 3 (Upper)', 'Tier 4 (Top Stack)'];
    const tierLabel = tierLabels[tier - 1] || `Tier ${tier}`;

    if (isOccupied) {
      const containerNo =
        tier === slot.tierLevel
          ? (slot.containerNumber || 'MSCU7091240')
          : `${(slot.shippingLine || 'MSCU').substring(0, 4).toUpperCase()}U${7000000 + (tier * 3317) % 899999}`;

      const cycle =
        tier === 1
          ? `${slot.cycle || 'Import Clearance Cycle'} • Ground Base Stacking`
          : `${slot.cycle || 'General Yard Storage'} • Elevated Stacking Tier ${tier}`;

      return {
        tier,
        tierLabel,
        containerNumber: containerNo,
        cycle,
        isOccupied: true,
        shippingLine: slot.shippingLine || 'MSCU',
        isoCode: slot.isoCode || '40HC',
        grossWeightKg: (slot.grossWeightKg || 22400) - (tier - 1) * 1200,
      };
    } else {
      return {
        tier,
        tierLabel,
        containerNumber: 'Available / Vacant Level',
        cycle: `Available for Inbound Allocation (Max Capacity: 4 Tiers)`,
        isOccupied: false,
        shippingLine: undefined,
        isoCode: undefined,
      };
    }
  });

  // Distinct dropdown options
  public readonly locationOptions = computed<string[]>(() => {
    const names = this.allSlots().map((s) => s.name);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  });

  public readonly containerOptions = computed<string[]>(() => {
    const containers = this.allSlots()
      .map((s) => s.containerNumber)
      .filter((c): c is string => !!c);
    return Array.from(new Set(containers)).sort();
  });

  public readonly cycleOptions = computed<{ id: string; name: string }[]>(() => {
    return [
      { id: 'all', name: 'All Operations Cycles' },
      { id: 'Import Clearance Cycle', name: 'Import Clearance Cycle' },
      { id: 'Export Buffer Cycle', name: 'Export Buffer Cycle' },
      { id: 'Empty Storage Cycle', name: 'Empty Storage Cycle' },
      { id: 'General Staging Cycle', name: 'General Staging Cycle' },
      { id: 'Trailer Marshalling Cycle', name: 'Trailer Marshalling Cycle' },
      { id: 'Reefer Cold Chain Cycle', name: 'Reefer Cold Chain Cycle' },
      { id: 'Customs Examination Cycle', name: 'Customs Examination Cycle' },
    ];
  });

  // Filtered slots based on active dropdowns
  public readonly displayedSlots = computed<ParkingSlot[]>(() => {
    let list = this.allSlots();

    const loc = this.filterLocation();
    if (loc) {
      list = list.filter((s) => s.name.toLowerCase() === loc.toLowerCase());
    }

    const cont = this.filterContainerNo();
    if (cont) {
      list = list.filter((s) => s.containerNumber?.toLowerCase() === cont.toLowerCase());
    }

    const cycle = this.filterCycle();
    if (cycle && cycle !== 'all') {
      list = list.filter((s) => (s.cycle || '').toLowerCase() === cycle.toLowerCase());
    }

    return list;
  });

  // Compute Block Clusters for clean zoomed-out navigation
  public readonly blockClusters = computed<BlockCluster[]>(() => {
    const slots = this.allSlots();
    const blockKeys = ['A', 'B', 'C', 'D', 'F', 'H', 'I'];
    const meta: Record<string, { title: string; icon: string; color: string }> = {
      A: { title: 'Block A (Import)', icon: 'apartment', color: '#38bdf8' },
      B: { title: 'Block B (Export)', icon: 'directions_boat', color: '#34d399' },
      C: { title: 'Block C (Empty Depot)', icon: 'inventory_2', color: '#818cf8' },
      D: { title: 'Block D (General Staging)', icon: 'warehouse', color: '#38bdf8' },
      F: { title: 'Block F (Trailer Parking)', icon: 'local_shipping', color: '#f59e0b' },
      H: { title: 'Block H (Reefer Grid)', icon: 'ac_unit', color: '#06b6d4' },
      I: { title: 'Block I (Customs Shed)', icon: 'policy', color: '#f43f5e' },
    };

    const clusters: BlockCluster[] = [];

    for (const b of blockKeys) {
      const bSlots = slots.filter((s) => s.block === b);
      if (bSlots.length === 0) continue;

      const avgLat = bSlots.reduce((acc, s) => acc + s.lat, 0) / bSlots.length;
      const avgLng = bSlots.reduce((acc, s) => acc + s.lng, 0) / bSlots.length;
      const occupied = bSlots.filter((s) => s.status === 'occupied').length;

      clusters.push({
        block: b,
        title: meta[b]?.title || `Block ${b}`,
        icon: meta[b]?.icon || 'pin_drop',
        color: meta[b]?.color || '#38bdf8',
        centerLat: avgLat,
        centerLng: avgLng,
        totalSlots: bSlots.length,
        occupiedSlots: occupied,
      });
    }

    return clusters;
  });

  public ngAfterViewInit(): void {
    this.initializeLeafletMap();
  }

  public ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initializeLeafletMap(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container) return;

    this.map = L.map(container, {
      center: [18.9028, 73.0465],
      zoom: 18.5,
      minZoom: 15,
      maxZoom: 22,
      zoomControl: false,
    });

    this.setTileLayer('google-hybrid');

    this.polygonLayerGroup = L.layerGroup().addTo(this.map);
    this.blockBadgeLayerGroup = L.layerGroup().addTo(this.map);
    this.markerLayerGroup = L.layerGroup().addTo(this.map);
    this.highlightCircleGroup = L.layerGroup().addTo(this.map);

    // Zoom listener for clean Dynamic Level of Detail (LOD)
    this.map.on('zoomend', () => {
      const z = this.map?.getZoom() ?? 18.5;
      this.currentZoomLevel.set(z);
      this.updateZoomLevelOfDetail();
    });

    this.renderGpsPolygons();

    // Auto-fit all slots bounds on initial load
    const all = this.allSlots();
    if (all.length > 0) {
      const allBounds = L.latLngBounds(all.map((s) => [s.lat, s.lng]));
      this.map.fitBounds(allBounds, { padding: [30, 30] });
    }

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  public setTileLayer(type: 'google-hybrid' | 'esri-satellite' | 'google-street'): void {
    if (!this.map) return;
    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    this.activeBaseLayer.set(type);

    let url = '';
    let attribution = '';

    if (type === 'google-hybrid') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = 'Google Satellite';
    } else if (type === 'esri-satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri Satellite';
    } else {
      url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = 'Google Street';
    }

    this.currentTileLayer = L.tileLayer(url, {
      maxZoom: 22,
      maxNativeZoom: 20,
      attribution,
    }).addTo(this.map);
  }

  // Render uniform dark-shade parking polygons with high-accuracy GPS coordinates
  public renderGpsPolygons(): void {
    if (!this.map || !this.polygonLayerGroup) return;

    this.polygonLayerGroup.clearLayers();

    const currentSelected = this.selectedSlot();
    const currentLoc = this.filterLocation();
    const slotsToRender = this.displayedSlots();

    for (const slot of slotsToRender) {
      if (!slot.polygonPoints || slot.polygonPoints.length === 0) continue;

      const latLngs: [number, number][] = slot.polygonPoints.map((p) => [p.lat, p.lng]);
      const isSelected = currentSelected?.id === slot.id || (currentLoc && slot.name === currentLoc);
      const isOccupied = slot.status === 'occupied';

      // Uniform Clean Dark-Shade Polygons
      const fillColor = '#0a0f1d';
      const strokeColor = isSelected ? '#facc15' : isOccupied ? '#38bdf8' : '#34d399';
      const fillOpacity = isSelected ? 0.95 : 0.78;
      const weight = isSelected ? 3.5 : 1.5;

      const polygon = L.polygon(latLngs, {
        color: strokeColor,
        fillColor,
        fillOpacity,
        weight,
        className: `dark-slot-polygon ${isSelected ? 'slot-highlight-animated' : ''}`,
      });

      polygon.bindTooltip(
        `<div class="p-1">
          <div class="font-extrabold text-xs text-amber-300 font-mono tracking-wider">${slot.name}</div>
          <div class="text-[11px] text-white">Status: <span class="font-bold ${isOccupied ? 'text-cyan-300' : 'text-emerald-300'}">${slot.status.toUpperCase()}</span></div>
          ${slot.containerNumber ? `<div class="text-[10px] text-cyan-200 font-mono">📦 ${slot.containerNumber}</div>` : ''}
          ${slot.cycle ? `<div class="text-[9px] text-slate-300 mt-0.5">🔄 ${slot.cycle}</div>` : ''}
        </div>`,
        {
          sticky: true,
          className: 'dark-leaflet-tooltip',
        },
      );

      polygon.on('click', () => {
        this.selectAndHighlightSlot(slot);
      });

      polygon.on('mouseover', () => {
        this.hoveredSlot.set(slot);
      });

      polygon.on('mouseout', () => {
        this.hoveredSlot.set(null);
      });

      this.polygonLayerGroup.addLayer(polygon);
    }

    // Now update markers based on current zoom level (prevents cluttered text overlap when zoomed out!)
    this.updateZoomLevelOfDetail();
  }

  // DYNAMIC LEVEL OF DETAIL (LOD) MARKER VISIBILITY ENGINE
  public updateZoomLevelOfDetail(): void {
    if (!this.map || !this.markerLayerGroup || !this.blockBadgeLayerGroup || !this.highlightCircleGroup) return;

    this.markerLayerGroup.clearLayers();
    this.blockBadgeLayerGroup.clearLayers();
    this.highlightCircleGroup.clearLayers();

    const zoom = this.map.getZoom();
    const isZoomedIn = zoom >= 19.3; // When zoomed in close, show individual slot labels cleanly
    const currentSelected = this.selectedSlot();
    const currentLoc = this.filterLocation();
    const slotsToRender = this.displayedSlots();

    if (!isZoomedIn) {
      // ZOOMED OUT: Show clean, elegant Block Group Badges (ZERO text clutter!)
      for (const cluster of this.blockClusters()) {
        const clusterHtml = `
          <div class="cfs-block-cluster-badge">
            <span class="material-icons text-sm text-cyan-400">${cluster.icon}</span>
            <span>${cluster.title}</span>
            <span class="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono">${cluster.occupiedSlots}/${cluster.totalSlots}</span>
          </div>
        `;

        const clusterIcon = L.divIcon({
          className: 'cfs-block-div-icon',
          html: clusterHtml,
          iconSize: [160, 28],
          iconAnchor: [80, 14],
        });

        const clusterMarker = L.marker([cluster.centerLat, cluster.centerLng], { icon: clusterIcon });
        clusterMarker.on('click', () => {
          this.flyToBlockCluster(cluster);
        });

        this.blockBadgeLayerGroup.addLayer(clusterMarker);
      }

      // If a specific slot is selected, always show its highlighted beacon even when zoomed out!
      if (currentSelected) {
        this.renderSingleSlotBeacon(currentSelected);
      }
    } else {
      // ZOOMED IN: Render individual slot labels with proper spacing
      for (const slot of slotsToRender) {
        const isSelected = currentSelected?.id === slot.id || (currentLoc && slot.name === currentLoc);
        const isOccupied = slot.status === 'occupied';

        const labelHtml = `
          <div class="dark-slot-centroid-badge ${isSelected ? 'selected-beacon' : isOccupied ? 'occupied' : 'available'}">
            <span>${slot.code}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'dark-slot-div-icon',
          html: labelHtml,
          iconSize: [36, 14],
          iconAnchor: [18, 7],
        });

        const marker = L.marker([slot.lat, slot.lng], { icon });
        marker.on('click', () => {
          this.selectAndHighlightSlot(slot);
        });

        this.markerLayerGroup.addLayer(marker);

        if (isSelected) {
          this.renderSingleSlotBeacon(slot);
        }
      }
    }
  }

  private renderSingleSlotBeacon(slot: ParkingSlot): void {
    if (!this.highlightCircleGroup) return;

    const pulseCircle = L.circleMarker([slot.lat, slot.lng], {
      radius: 26,
      color: '#facc15',
      weight: 2.5,
      fillColor: '#facc15',
      fillOpacity: 0.25,
      className: 'animated-pulse-marker',
    });
    this.highlightCircleGroup.addLayer(pulseCircle);
  }

  public flyToBlockCluster(cluster: BlockCluster): void {
    const bSlots = this.allSlots().filter((s) => s.block === cluster.block);
    if (bSlots.length > 0 && this.map) {
      const bounds = L.latLngBounds(bSlots.map((s) => [s.lat, s.lng]));
      this.map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 20, duration: 1.2 });
      this.triggerToast(`Viewing ${cluster.title}`);
    }
  }

  // When user selects a Parking Location from dropdown
  public onLocationChange(locName: string): void {
    this.filterLocation.set(locName);
    if (!locName) {
      this.renderGpsPolygons();
      return;
    }

    const found = this.allSlots().find((s) => s.name === locName);
    if (found) {
      this.selectAndHighlightSlot(found);
      this.map?.flyTo([found.lat, found.lng], 20, { duration: 1.2 });
      this.triggerToast(`Locked onto ${found.name}`);
    }
  }

  // When user selects a Container Number from dropdown
  public onContainerChange(contNo: string): void {
    this.filterContainerNo.set(contNo);
    if (!contNo) {
      this.renderGpsPolygons();
      return;
    }

    const found = this.allSlots().find((s) => s.containerNumber === contNo);
    if (found) {
      this.selectAndHighlightSlot(found);
      this.map?.flyTo([found.lat, found.lng], 20, { duration: 1.2 });
      this.triggerToast(`Container ${found.containerNumber} located at ${found.name}`);
    }
  }

  // When user selects an Operations Cycle from dropdown
  public onCycleChange(cycle: string): void {
    this.filterCycle.set(cycle);
    this.renderGpsPolygons();

    const filtered = this.displayedSlots();
    if (filtered.length > 0 && this.map) {
      const bounds = L.latLngBounds(filtered.map((s) => [s.lat, s.lng]));
      this.map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 19.5, duration: 1.2 });
      this.triggerToast(`Filtered: ${cycle === 'all' ? 'All Operations Cycles' : cycle} (${filtered.length} locations)`);
    }
  }

  // Clear all filters and return to whole map view
  public resetFilters(): void {
    this.filterLocation.set('');
    this.filterContainerNo.set('');
    this.filterCycle.set('all');
    this.yardService.selectSlot(null);
    this.renderGpsPolygons();

    const all = this.allSlots();
    if (all.length > 0 && this.map) {
      const allBounds = L.latLngBounds(all.map((s) => [s.lat, s.lng]));
      this.map.flyToBounds(allBounds, { padding: [30, 30], duration: 1.2 });
    }
    this.triggerToast('All filters cleared. Whole yard map active.');
  }

  public selectAndHighlightSlot(slot: ParkingSlot): void {
    this.selectedTier.set(slot.tierLevel || 1);
    this.yardService.selectSlot(slot);
    this.renderGpsPolygons();
    this.map?.panTo([slot.lat, slot.lng], { animate: true, duration: 0.5 });
  }

  public selectTier(tier: number): void {
    this.selectedTier.set(tier);
    this.triggerToast(`Viewing Level / Tier ${tier} specification`);
  }

  public closeDetailBox(): void {
    this.yardService.selectSlot(null);
    this.renderGpsPolygons();
  }

  public zoomIn(): void {
    this.map?.zoomIn();
  }

  public zoomOut(): void {
    this.map?.zoomOut();
  }

  public resetZoom(): void {
    const all = this.allSlots();
    if (all.length > 0 && this.map) {
      const allBounds = L.latLngBounds(all.map((s) => [s.lat, s.lng]));
      this.map.flyToBounds(allBounds, { padding: [30, 30], duration: 1 });
    }
  }

  public getSlotStatusBadgeClass(status: ParkingSlotStatus): string {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]';
      case 'occupied':
        return 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]';
      case 'reserved':
        return 'bg-amber-500/20 text-amber-300 border border-amber-400/50';
      case 'incoming':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/50 animate-pulse';
      case 'maintenance':
        return 'bg-rose-500/20 text-rose-300 border border-rose-400/50';
      default:
        return 'bg-slate-700 text-white';
    }
  }

  public getShippingLineColor(line?: string): string {
    if (!line) return 'bg-slate-800 text-white border-slate-700';
    const lower = line.toLowerCase();
    if (lower.includes('maersk')) return 'bg-sky-500/20 text-sky-400 border border-sky-400/50';
    if (lower.includes('msc')) return 'bg-amber-500/20 text-amber-400 border border-amber-400/50';
    if (lower.includes('cma')) return 'bg-rose-500/20 text-rose-400 border border-rose-400/50';
    if (lower.includes('hapag')) return 'bg-orange-500/20 text-orange-400 border border-orange-400/50';
    if (lower.includes('one')) return 'bg-pink-500/20 text-pink-400 border border-pink-400/50';
    if (lower.includes('evergreen')) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/50';
    return 'bg-slate-800 text-white border-slate-700';
  }

  public triggerToast(msg: string): void {
    this.actionToast.set(msg);
    setTimeout(() => {
      if (this.actionToast() === msg) {
        this.actionToast.set('');
      }
    }, 3500);
  }
}
