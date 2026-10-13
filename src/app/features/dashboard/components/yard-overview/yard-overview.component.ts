import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { YardBlockRow, YardMetrics } from 'shared/types/dashboard/dashboard.interface';
import { CFS_GPS_SLOTS } from '../../../yard-map/yard-map-data';

declare const L: any;

export interface YardBlockBadge {
  name: string;
  occupancyPct: number;
  occupied: number;
  total: number;
}

@Component({
  selector: 'app-yard-overview',
  standalone: true,
  imports: [],
  templateUrl: './yard-overview.component.html',
  styleUrls: ['./yard-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YardOverviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly router = inject(Router);
  private map: any = null;
  private polygonLayerGroup: any = null;
  private badgeLayerGroup: any = null;

  public readonly metrics = input<YardMetrics>({
    totalBlocks: 6,
    totalRows: 12,
    teuCapacity: 1200,
    currentTeu: 816,
    utilizationPercentage: 68,
  });
  public readonly yardRows = input<YardBlockRow[]>([]);

  public readonly activeView = signal<'map' | 'list'>('map');
  public readonly activeMapStyle = signal<'satellite' | 'street'>('satellite');

  public readonly blockBadges: YardBlockBadge[] = (() => {
    const blocks = [
      { key: 'A', name: 'Block A (Import)' },
      { key: 'B', name: 'Block B (Export)' },
      { key: 'C', name: 'Block C (Empty Depot)' },
      { key: 'D', name: 'Block D (General Yard)' },
      { key: 'F', name: 'Block F (Trailer Parking)' },
      { key: 'H', name: 'Block H (Reefer Grid)' },
    ];
    return blocks.map((b) => {
      const bSlots = CFS_GPS_SLOTS.filter((s) => s.block === b.key);
      const total = bSlots.length;
      const occupied = bSlots.filter((s) => s.status === 'occupied').length;
      const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return { name: b.name, occupancyPct, occupied, total };
    });
  })();

  public readonly totalCapacity = computed(() => this.metrics()?.teuCapacity || 1200);
  public readonly usedCapacity = computed(() => this.metrics()?.currentTeu || 816);
  public readonly availableCapacity = computed(() => {
    const cap = this.totalCapacity();
    const used = this.usedCapacity();
    return Math.max(0, cap - used);
  });

  ngAfterViewInit(): void {
    if (this.activeView() === 'map') {
      setTimeout(() => this.initMap(), 60);
    }
  }

  public setView(view: 'map' | 'list'): void {
    this.activeView.set(view);
    if (view === 'map') {
      setTimeout(() => {
        this.initMap();
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 60);
    }
  }

  public toggleMapStyle(style: 'satellite' | 'street'): void {
    this.activeMapStyle.set(style);
    this.initMap();
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;
    if (typeof L === 'undefined') return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    try {
      // Center at Sarveshwar CFS GPS coordinates: [18.9028, 73.0465]
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [18.9028, 73.0465],
        zoom: 17.5,
        minZoom: 16,
        maxZoom: 21,
        zoomControl: false,
        attributionControl: false,
      });

      // Base tile layer (Default to Pure High-Resolution Satellite without commercial POI clutter)
      const tileUrl =
        this.activeMapStyle() === 'satellite'
          ? 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
          : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

      L.tileLayer(tileUrl, {
        maxZoom: 21,
        maxNativeZoom: 20,
      }).addTo(this.map);

      this.polygonLayerGroup = L.layerGroup().addTo(this.map);

      // Vibrant high-visibility Terminal Operating System (TOS) palette:
      // - Top clusters (F, E, 14): Industrial Orange / Amber
      // - Center-Left column (D): Electric Cyan / Sky Blue
      // - Center-Right column (C, ED): Vivid Royal Blue
      // - Right stacks (B, A): Vivid Emerald Green
      const blockColorMap: Record<string, { stroke: string; fill: string }> = {
        A: { stroke: '#10b981', fill: '#059669' }, // Import: Vivid Terminal Emerald
        B: { stroke: '#10b981', fill: '#059669' }, // Export: Vivid Terminal Emerald
        C: { stroke: '#3b82f6', fill: '#2563eb' }, // Empty Depot: Vivid Royal Blue
        ED: { stroke: '#3b82f6', fill: '#2563eb' }, // Empty Depot: Vivid Royal Blue
        D: { stroke: '#06b6d4', fill: '#0284c7' }, // General Staging: Vivid Cyan / Sky Blue
        E: { stroke: '#f97316', fill: '#ea580c' }, // Export Staging: Industrial Orange
        F: { stroke: '#f97316', fill: '#ea580c' }, // Trailer Parking: Industrial Orange
        '14': { stroke: '#f97316', fill: '#ea580c' }, // Trailer Bay 14: Industrial Orange
        G: { stroke: '#6366f1', fill: '#4f46e5' }, // Heavy Ground: Vivid Indigo
        H: { stroke: '#06b6d4', fill: '#0891b2' }, // Reefer Grid: Arctic Ice Cyan
        I: { stroke: '#ef4444', fill: '#dc2626' }, // Customs Examination: Safety Crimson
        HS: { stroke: '#f59e0b', fill: '#d97706' }, // Hazardous: Warning Amber
      };

      // Render all surveyed geofences with clean high-visibility styling
      CFS_GPS_SLOTS.forEach((slot) => {
        const polyCoords = slot.polygon.map((pt) => [pt.lat, pt.lng]);
        const block = (slot.block || 'A').toUpperCase();
        const colors = blockColorMap[block] || { stroke: '#06b6d4', fill: '#0284c7' };
        const isOccupied = slot.status === 'occupied';

        const strokeColor = colors.stroke;
        const fillColor = colors.fill;
        const fillOpacity = isOccupied ? 0.38 : 0.18;
        const weight = 1.8;
        const opacity = 0.95;

        const polygon = L.polygon(polyCoords, {
          color: strokeColor,
          weight,
          opacity,
          fillColor,
          fillOpacity,
          className: 'yard-geofence-slot cursor-pointer',
        });

        const statusBadge = isOccupied
          ? '<span style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9.5px; text-transform: uppercase;">OCCUPIED</span>'
          : '<span style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9.5px; text-transform: uppercase;">AVAILABLE</span>';

        polygon.bindTooltip(`
          <div class="cfs-light-popup-content" style="min-width: 175px; padding: 8px 10px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; border-radius: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-family: monospace; font-size: 13px; font-weight: 900; color: #0f2851;">📍 ${slot.name}</span>
              ${statusBadge}
            </div>
            <div style="font-family: monospace; font-size: 10px; font-weight: 700; color: #0284c7; margin-bottom: 3px;">
              🌐 ${slot.center.lat.toFixed(6)}° N, ${slot.center.lng.toFixed(6)}° E
            </div>
            <div style="font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 3px;">
              ${slot.zoneType}
            </div>
            ${slot.containerNumber ? `<div style="font-family: monospace; font-size: 11px; font-weight: 800; color: #1e3a8a; background: #eff6ff; padding: 3px 6px; border-radius: 5px; border: 1px solid #bfdbfe; margin-top: 4px; display: flex; align-items: center; gap: 4px;"><span>📦</span> <span>${slot.containerNumber}</span></div>` : ''}
          </div>
        `, {
          sticky: true,
          direction: 'top',
          className: 'yard-light-dashboard-tooltip',
          offset: [0, -10],
          opacity: 1,
        });

        polygon.on('click', () => {
          this.navigateToYardMap();
        });

        this.polygonLayerGroup.addLayer(polygon);
      });

      // Keep zoomed in by default on Sarveshwar CFS yard core container stacks
      this.map.setView([18.9031, 73.0466], 18.8);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);

    } catch (e) {
      console.warn('Leaflet map initialization skipped:', e);
    }
  }

  public navigateToYardMap(): void {
    this.router.navigate(['/yard-map']);
  }

  public zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  public zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}



