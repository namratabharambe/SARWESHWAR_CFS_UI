import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { YardMapComponent } from './yard-map.component';
import { YardMapService } from './yard-map.service';

describe('YardMapComponent', () => {
  let component: YardMapComponent;
  let fixture: ComponentFixture<YardMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YardMapComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(YardMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the yard map component', () => {
    expect(component).toBeTruthy();
  });

  it('should have telemetry data initialized', () => {
    const telemetry = component.telemetry();
    expect(telemetry.totalParkingBays).toBeGreaterThan(0);
    expect(telemetry.teuCapacity).toBe(1200);
  });

  it('should filter slots by zone', () => {
    component.setZoneFilter('truck-parking');
    expect(component.activeZoneFilter()).toBe('truck-parking');
    const filtered = component.slots();
    expect(filtered.every((s) => s.zone === 'truck-parking')).toBe(true);
  });

  it('should zoom in and out properly', () => {
    const initialZoom = component.zoomLevel();
    component.zoomIn();
    expect(component.zoomLevel()).toBeGreaterThan(initialZoom);
    component.resetZoom();
    expect(component.zoomLevel()).toBe(1);
  });
});
