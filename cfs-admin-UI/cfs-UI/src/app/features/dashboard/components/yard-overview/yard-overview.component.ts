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

      // Enterprise Standard Marine Terminal (TOS) Harmonious Palette
      const blockColorMap: Record<string, { stroke: string; fill: string }> = {
        A: { stroke: '#0284c7', fill: '#0369a1' }, // Import Containers: Classic Marine Cyan
        B: { stroke: '#059669', fill: '#047857' }, // Export Containers: Maritime Emerald
        C: { stroke: '#4338ca', fill: '#3730a3' }, // Empty Depot: Deep Indigo
        D: { stroke: '#2563eb', fill: '#1d4ed8' }, // General Staging: Steel Blue
        E: { stroke: '#059669', fill: '#047857' }, // Export Staging: Maritime Emerald
        F: { stroke: '#b45309', fill: '#92400e' }, // Trailer Parking: Terminal Amber
        G: { stroke: '#1d4ed8', fill: '#1e40af' }, // Heavy Ground: Steel Blue
        H: { stroke: '#0e7490', fill: '#155e75' }, // Reefer Grid: Arctic Cold Blue
        I: { stroke: '#b91c1c', fill: '#991b1b' }, // Customs Examination: Safety Crimson
        ED: { stroke: '#4338ca', fill: '#3730a3' }, // Empty Depot: Deep Indigo
        HS: { stroke: '#c2410c', fill: '#9a3412' }, // Hazardous: Warning Orange
        '14': { stroke: '#b45309', fill: '#92400e' }, // Trailer Bay 14: Terminal Amber
      };

      // Render all 544 surveyed geofences with clean enterprise TOS standards
      CFS_GPS_SLOTS.forEach((slot) => {
        const polyCoords = slot.polygon.map((pt) => [pt.lat, pt.lng]);
        const block = (slot.block || 'A').toUpperCase();
        const colors = blockColorMap[block] || { stroke: '#0284c7', fill: '#0369a1' };
        const isOccupied = slot.status === 'occupied';

        const strokeColor = isOccupied ? colors.stroke : '#64748b';
        const fillColor = isOccupied ? colors.fill : '#334155';
        const fillOpacity = isOccupied ? 0.45 : 0.05;
        const weight = isOccupied ? 1.3 : 1.0;

        const polygon = L.polygon(polyCoords, {
          color: strokeColor,
          weight,
          opacity: isOccupied ? 0.95 : 0.65,
          fillColor,
          fillOpacity,
          className: 'yard-geofence-slot cursor-pointer',
        });

        polygon.bindTooltip(`
          <div class="px-2.5 py-1.5 font-sans text-xs bg-slate-900/95 text-white rounded-lg border border-slate-700/80 shadow-xl backdrop-blur-md">
            <div class="font-bold font-mono text-amber-400">📍 ${slot.name} <span class="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${isOccupied ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'}">${slot.status}</span></div>
            <div class="text-[10px] text-slate-300 mt-0.5">${slot.zoneType}</div>
            ${slot.containerNumber ? `<div class="font-mono text-cyan-300 text-[10px] font-bold mt-1">📦 ${slot.containerNumber}</div>` : ''}
          </div>
        `, { sticky: true, direction: 'top', opacity: 0.98 });

        polygon.on('click', () => {
          this.navigateToYardMap();
        });

        this.polygonLayerGroup.addLayer(polygon);
      });

      // Keep zoomed in by default on Sarveshwar CFS yard [18.9028, 73.0465]
      this.map.setView([18.9028, 73.0465], 18.5);

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



