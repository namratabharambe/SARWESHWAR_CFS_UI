import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, inject, input, signal, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { YardBlockRow, YardMetrics } from 'shared/types/dashboard/dashboard.interface';

declare const L: any;

export interface YardBlockBadge {
  name: string;
  occupancyPct: number;
}

@Component({
  selector: 'app-yard-overview',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './yard-overview.component.html',
  styleUrls: ['./yard-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YardOverviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly router = inject(Router);
  private map: any = null;

  public readonly metrics = input<YardMetrics>({
    totalBlocks: 4,
    totalRows: 4,
    teuCapacity: 1200,
    currentTeu: 816,
    utilizationPercentage: 68,
  });
  public readonly yardRows = input<YardBlockRow[]>([]);

  public readonly activeView = signal<'map' | 'list'>('map');

  public readonly blockBadges: YardBlockBadge[] = [
    { name: 'Block A', occupancyPct: 68 },
    { name: 'Block B', occupancyPct: 72 },
    { name: 'Block C', occupancyPct: 59 },
    { name: 'Block D', occupancyPct: 47 },
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
      setTimeout(() => this.initMap(), 50);
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
      }, 50);
    }
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;
    if (typeof L === 'undefined') return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    try {
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [18.950, 72.950],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      // Block A (Blue - 68%)
      const blockA = L.polygon([
        [18.955, 72.942],
        [18.955, 72.948],
        [18.950, 72.948],
        [18.950, 72.942],
      ], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.45,
        weight: 2,
      }).addTo(this.map);
      
      blockA.bindTooltip(`
        <div class="yard-tooltip-card">
          <div class="tooltip-header text-blue-600 font-bold border-b border-slate-100 pb-1 mb-1">BLOCK A</div>
          <div class="text-xs">Occupancy: <strong class="text-slate-900">68%</strong></div>
          <div class="text-xs">Capacity: <strong class="text-slate-900">320 TEU</strong></div>
          <div class="text-xs">Used: <strong class="text-slate-900">218 TEU</strong></div>
          <div class="text-xs">Available: <strong class="text-slate-900">102 TEU</strong></div>
        </div>
      `, { sticky: true, direction: 'top', className: 'yard-map-tooltip-custom' });

      blockA.bindPopup(`
        <div class="yard-popup-card">
          <div class="popup-header text-blue-600 font-bold">BLOCK A DETAILS</div>
          <div class="popup-row"><span>Occupancy:</span> <strong>68%</strong></div>
          <div class="popup-row"><span>Capacity:</span> <strong>320 TEU</strong></div>
          <div class="popup-row"><span>Used:</span> <strong>218 TEU</strong></div>
          <div class="popup-row"><span>Available:</span> <strong>102 TEU</strong></div>
          <div class="popup-status text-blue-600 font-semibold mt-1">Status: Active Stacking Zone</div>
        </div>
      `);

      // Block B (Amber - 72%)
      const blockB = L.polygon([
        [18.955, 72.952],
        [18.955, 72.958],
        [18.950, 72.958],
        [18.950, 72.952],
      ], {
        color: '#d97706',
        fillColor: '#f59e0b',
        fillOpacity: 0.45,
        weight: 2,
      }).addTo(this.map);

      blockB.bindTooltip(`
        <div class="yard-tooltip-card">
          <div class="tooltip-header text-amber-600 font-bold border-b border-slate-100 pb-1 mb-1">BLOCK B</div>
          <div class="text-xs">Occupancy: <strong class="text-slate-900">72%</strong></div>
          <div class="text-xs">Capacity: <strong class="text-slate-900">340 TEU</strong></div>
          <div class="text-xs">Used: <strong class="text-slate-900">245 TEU</strong></div>
          <div class="text-xs">Available: <strong class="text-slate-900">95 TEU</strong></div>
        </div>
      `, { sticky: true, direction: 'top', className: 'yard-map-tooltip-custom' });

      blockB.bindPopup(`
        <div class="yard-popup-card">
          <div class="popup-header text-amber-600 font-bold">BLOCK B DETAILS</div>
          <div class="popup-row"><span>Occupancy:</span> <strong>72%</strong></div>
          <div class="popup-row"><span>Capacity:</span> <strong>340 TEU</strong></div>
          <div class="popup-row"><span>Used:</span> <strong>245 TEU</strong></div>
          <div class="popup-row"><span>Available:</span> <strong>95 TEU</strong></div>
          <div class="popup-status text-amber-600 font-semibold mt-1">Status: High Density Zone</div>
        </div>
      `);

      // Block C (Cyan - 59%)
      const blockC = L.polygon([
        [18.948, 72.942],
        [18.948, 72.948],
        [18.943, 72.948],
        [18.943, 72.942],
      ], {
        color: '#0891b2',
        fillColor: '#06b6d4',
        fillOpacity: 0.45,
        weight: 2,
      }).addTo(this.map);

      blockC.bindTooltip(`
        <div class="yard-tooltip-card">
          <div class="tooltip-header text-cyan-600 font-bold border-b border-slate-100 pb-1 mb-1">BLOCK C</div>
          <div class="text-xs">Occupancy: <strong class="text-slate-900">59%</strong></div>
          <div class="text-xs">Capacity: <strong class="text-slate-900">280 TEU</strong></div>
          <div class="text-xs">Used: <strong class="text-slate-900">165 TEU</strong></div>
          <div class="text-xs">Available: <strong class="text-slate-900">115 TEU</strong></div>
        </div>
      `, { sticky: true, direction: 'top', className: 'yard-map-tooltip-custom' });

      blockC.bindPopup(`
        <div class="yard-popup-card">
          <div class="popup-header text-cyan-600 font-bold">BLOCK C DETAILS</div>
          <div class="popup-row"><span>Occupancy:</span> <strong>59%</strong></div>
          <div class="popup-row"><span>Capacity:</span> <strong>280 TEU</strong></div>
          <div class="popup-row"><span>Used:</span> <strong>165 TEU</strong></div>
          <div class="popup-row"><span>Available:</span> <strong>115 TEU</strong></div>
          <div class="popup-status text-cyan-600 font-semibold mt-1">Status: Normal Operations</div>
        </div>
      `);

      // Block D (Rose - 47%)
      const blockD = L.polygon([
        [18.948, 72.952],
        [18.948, 72.958],
        [18.943, 72.958],
        [18.943, 72.952],
      ], {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.45,
        weight: 2,
      }).addTo(this.map);

      blockD.bindTooltip(`
        <div class="yard-tooltip-card">
          <div class="tooltip-header text-rose-600 font-bold border-b border-slate-100 pb-1 mb-1">BLOCK D</div>
          <div class="text-xs">Occupancy: <strong class="text-slate-900">47%</strong></div>
          <div class="text-xs">Capacity: <strong class="text-slate-900">260 TEU</strong></div>
          <div class="text-xs">Used: <strong class="text-slate-900">122 TEU</strong></div>
          <div class="text-xs">Available: <strong class="text-slate-900">138 TEU</strong></div>
        </div>
      `, { sticky: true, direction: 'top', className: 'yard-map-tooltip-custom' });

      blockD.bindPopup(`
        <div class="yard-popup-card">
          <div class="popup-header text-rose-600 font-bold">BLOCK D DETAILS</div>
          <div class="popup-row"><span>Occupancy:</span> <strong>47%</strong></div>
          <div class="popup-row"><span>Capacity:</span> <strong>260 TEU</strong></div>
          <div class="popup-row"><span>Used:</span> <strong>122 TEU</strong></div>
          <div class="popup-row"><span>Available:</span> <strong>138 TEU</strong></div>
          <div class="popup-status text-rose-600 font-semibold mt-1">Status: Crane 02 Operating</div>
        </div>
      `);

      // Custom divIcon markers for crisp SVG icons without dependency on external PNGs
      const craneIcon = L.divIcon({
        className: 'custom-map-icon crane-icon',
        html: `<div style="background:#7c3aed;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.25);font-size:14px;">⚙</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const truckIcon = L.divIcon({
        className: 'custom-map-icon truck-icon',
        html: `<div style="background:#2563eb;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.25);font-size:14px;">🚛</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const containerIcon = L.divIcon({
        className: 'custom-map-icon container-icon',
        html: `<div style="background:#0891b2;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.25);font-size:14px;">📦</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Equipment Marker (Crane 02 Active)
      const craneMarker = L.marker([18.945, 72.955], { icon: craneIcon }).addTo(this.map);
      craneMarker.bindTooltip(`
        <div class="yard-tooltip-card">
          <div class="tooltip-header text-purple-600 font-bold border-b border-slate-100 pb-1 mb-1">EQUIPMENT</div>
          <div class="text-xs">Equipment No: <strong class="text-slate-900">Crane 02</strong></div>
          <div class="text-xs">Type: <strong class="text-slate-900">Gantry Crane</strong></div>
          <div class="text-xs">Zone: <strong class="text-slate-900">Block D Stacking Zone</strong></div>
          <div class="text-xs">Status: <strong class="text-slate-900">Active Operations</strong></div>
        </div>
      `, { sticky: true, direction: 'top', className: 'yard-map-tooltip-custom' });

      craneMarker.bindPopup(`
        <div class="yard-popup-card">
          <div class="popup-header text-purple-600 font-bold">⚙ CRANE 02 ACTIVE</div>
          <div class="popup-row"><span>Equipment:</span> <strong>Gantry Crane #02</strong></div>
          <div class="popup-row"><span>Zone:</span> <strong>Block D Yard Bay</strong></div>
          <div class="popup-row"><span>Handling Rate:</span> <strong>18 moves/hr</strong></div>
          <div class="popup-status text-purple-600 font-semibold mt-1">Status: Active Operations</div>
        </div>
      `);

      // Truck Marker (MH 12 AB 1234)
      const truckMarker = L.marker([18.949, 72.950], { icon: truckIcon }).addTo(this.map);
      truckMarker.bindTooltip(`
        <div class="yard-tooltip-card">
          <div class="tooltip-header text-blue-600 font-bold border-b border-slate-100 pb-1 mb-1">TRUCK</div>
          <div class="text-xs">Truck No: <strong class="text-slate-900">MH 12 AB 1234</strong></div>
          <div class="text-xs">Container: <strong class="text-slate-900">TCNU6041954</strong></div>
          <div class="text-xs">Gate: <strong class="text-slate-900">Gate 01 Ingate</strong></div>
          <div class="text-xs">Status: <strong class="text-slate-900">In Transit</strong></div>
        </div>
      `, { sticky: true, direction: 'top', className: 'yard-map-tooltip-custom' });

      truckMarker.bindPopup(`
        <div class="yard-popup-card">
          <div class="popup-header text-blue-600 font-bold">🚛 TRUCK MH 12 AB 1234</div>
          <div class="popup-row"><span>Container:</span> <strong>TCNU6041954 (40 FT)</strong></div>
          <div class="popup-row"><span>Type:</span> <strong>Import Container</strong></div>
          <div class="popup-row"><span>Destination:</span> <strong>Block B Stacking Area</strong></div>
          <div class="popup-status text-blue-600 font-semibold mt-1">Status: In Transit</div>
        </div>
      `);

      // Container Marker (MSCU9823471)
      const containerMarker = L.marker([18.953, 72.945], { icon: containerIcon }).addTo(this.map);
      containerMarker.bindTooltip(`
        <div class="yard-tooltip-card">
          <div class="tooltip-header text-cyan-600 font-bold border-b border-slate-100 pb-1 mb-1">CONTAINER</div>
          <div class="text-xs">Container No: <strong class="text-slate-900">MSCU9823471</strong></div>
          <div class="text-xs">Size: <strong class="text-slate-900">40 FT</strong></div>
          <div class="text-xs">Type: <strong class="text-slate-900">Import Cargo</strong></div>
          <div class="text-xs">Status: <strong class="text-slate-900">Verified & Stacked</strong></div>
          <div class="text-xs">Location: <strong class="text-slate-900">Block A / Row 04 / Slot 14</strong></div>
        </div>
      `, { sticky: true, direction: 'top', className: 'yard-map-tooltip-custom' });

      containerMarker.bindPopup(`
        <div class="yard-popup-card">
          <div class="popup-header text-cyan-600 font-bold">📦 CONTAINER MSCU9823471</div>
          <div class="popup-row"><span>Size:</span> <strong>40 FT High Cube</strong></div>
          <div class="popup-row"><span>Type:</span> <strong>Import Cargo</strong></div>
          <div class="popup-row"><span>Location:</span> <strong>Block A / Row 04 / Slot 14</strong></div>
          <div class="popup-status text-cyan-600 font-semibold mt-1">Status: Verified & Stacked</div>
        </div>
      `);

      // Navigate to full Yard Map module when clicking anywhere on the map
      this.map.on('click', () => {
        this.navigateToYardMap();
      });

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



