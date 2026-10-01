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

  public readonly blockBadges: YardBlockBadge[] = [
    { name: 'Block A (Import)', occupancyPct: 60, occupied: 21, total: 35 },
    { name: 'Block B (Export)', occupancyPct: 62, occupied: 21, total: 34 },
    { name: 'Block C (Empty Depot)', occupancyPct: 61, occupied: 48, total: 79 },
    { name: 'Block D (General Yard)', occupancyPct: 60, occupied: 40, total: 67 },
    { name: 'Block F (Trailer Parking)', occupancyPct: 58, occupied: 11, total: 19 },
    { name: 'Block H (Reefer Grid)', occupancyPct: 60, occupied: 15, total: 25 },
  ];

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

      // Base tile layer
      const tileUrl =
        this.activeMapStyle() === 'satellite'
          ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
          : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

      L.tileLayer(tileUrl, {
        maxZoom: 21,
        maxNativeZoom: 20,
      }).addTo(this.map);

      this.polygonLayerGroup = L.layerGroup().addTo(this.map);
      this.badgeLayerGroup = L.layerGroup().addTo(this.map);

      // Render all 259 surveyed geofences
      const blockColorMap: Record<string, { stroke: string; fill: string }> = {
        A: { stroke: '#00f0ff', fill: '#06b6d4' },
        B: { stroke: '#10b981', fill: '#059669' },
        C: { stroke: '#6366f1', fill: '#4f46e5' },
        D: { stroke: '#38bdf8', fill: '#0284c7' },
        F: { stroke: '#f59e0b', fill: '#d97706' },
        H: { stroke: '#22d3ee', fill: '#0891b2' },
      };

      CFS_GPS_SLOTS.forEach((slot) => {
        const polyCoords = slot.polygon.map((pt) => [pt.lat, pt.lng]);
        const block = (slot.block || 'A').toUpperCase();
        const colors = blockColorMap[block] || { stroke: '#06b6d4', fill: '#0891b2' };
        const isOccupied = slot.status === 'occupied';

        const polygon = L.polygon(polyCoords, {
          color: colors.stroke,
          weight: 1.5,
          opacity: 0.95,
          fillColor: isOccupied ? colors.fill : '#0f172a',
          fillOpacity: isOccupied ? 0.65 : 0.25,
          className: 'yard-geofence-slot',
        });

        polygon.bindTooltip(`
          <div class="px-2 py-1 font-sans text-xs bg-slate-950/95 text-white rounded-md border border-cyan-500/50 shadow-md">
            <span class="font-bold text-amber-400">📍 ${slot.name}</span> <span class="text-[10px] text-cyan-200">(${slot.status})</span>
            ${slot.containerNumber ? `<div class="font-mono text-cyan-300 text-[10px] font-bold">📦 ${slot.containerNumber}</div>` : ''}
          </div>
        `, { sticky: true, direction: 'top', opacity: 0.95 });

        polygon.on('click', () => {
          this.navigateToYardMap();
        });

        this.polygonLayerGroup.addLayer(polygon);
      });

      // Render Block Cluster Badges with clean offsets
      const clusters = [
        { name: 'Block F (Trailers)', count: '11/19', lat: 18.9042, lng: 73.0456, icon: '🚛' },
        { name: 'Block D (General)', count: '40/67', lat: 18.9034, lng: 73.0459, icon: '🏢' },
        { name: 'Block C (Empty)', count: '48/79', lat: 18.9036, lng: 73.0467, icon: '📦' },
        { name: 'Block B (Export)', count: '21/34', lat: 18.9030, lng: 73.0471, icon: '🚢' },
        { name: 'Block A (Import)', count: '21/35', lat: 18.9023, lng: 73.0474, icon: '📥' },
        { name: 'Block H (Reefer)', count: '15/25', lat: 18.9015, lng: 73.0470, icon: '❄️' },
      ];

      clusters.forEach((c) => {
        const badgeIcon = L.divIcon({
          className: 'yard-cluster-badge-icon',
          html: `
            <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(6, 182, 212, 0.7); border-radius: 6px; padding: 2px 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.6); cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 3px;">
              <span style="font-size: 10px;">${c.icon}</span>
              <span style="color: #38bdf8; font-size: 9.5px; font-weight: 800;">${c.name}</span>
              <span style="background: rgba(6, 182, 212, 0.25); color: #67e8f9; font-size: 8.5px; font-weight: 900; padding: 0.5px 3px; border-radius: 3px;">${c.count}</span>
            </div>
          `,
          iconSize: [130, 22],
          iconAnchor: [65, 11],
        });

        const marker = L.marker([c.lat, c.lng], { icon: badgeIcon });
        marker.on('click', () => this.navigateToYardMap());
        this.badgeLayerGroup.addLayer(marker);
      });

      // Keep zoomed in by default on Sarveshwar CFS yard [18.9028, 73.0467]
      this.map.setView([18.9028, 73.0467], 18.6);

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



