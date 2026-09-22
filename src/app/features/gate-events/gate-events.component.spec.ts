import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';
import { GateEventsComponent } from './gate-events.component';
import { GateEventService } from 'shared/services/gate-event.service';
import { VisitsPagedResponse } from 'shared/types/gate-event/gate-event.interface';

describe('GateEventsComponent', () => {
  let component: GateEventsComponent;
  let fixture: ComponentFixture<GateEventsComponent>;
  let gateEventService: GateEventService;

  const mockVisitsResponse: VisitsPagedResponse = {
    items: [
      {
        visitId: 'VISIT-001',
        containerNumber: 'MSCU1234567',
        containerConfidence: 0.95,
        containerSize: '40',
        truckNumber: 'MH12AB1234',
        truckConfidence: null,
        driverName: 'Ramesh Kumar',
        driverId: null,
        status: 'IN_YARD',
        createdAt: '2026-09-15T10:46:07.666025+00:00',
        events: [
          {
            sourceEventId: 'AUTO-2CF4E57B53BDF42DE28178C92E428F52D53FADF44829F27F4F78134B1343FD9A',
            eventType: 'GATE_IN',
            deviceId: '01a07fcf-041d-74be-8d8f-14e12d9e4712',
            capturedAt: '2026-09-15T08:23:47.241+00:00',
            createdByUserId: '01a07fe6-824c-7c1d-969e-8d990e6bbffe',
            detectedContainerNumber: 'MSCU1234567',
            detectedContainerConfidence: 0.95,
            detectedContainerSize: '40',
            detectedTruckNumber: 'MH12AB1234',
            detectedTruckConfidence: null,
            images: [
              {
                id: 'ad7bd471-10b7-411f-a752-1245371aa311',
                imageType: 'LEFT',
                cameraId: 'CAM-01',
                capturedAt: '2026-09-15T08:23:47.241+00:00',
                imageUrl:
                  'https://cdn.example.com/SmartYard/01a07fcf041d74be8d8f14e12d9e471b/01a07fd0d69a7998bd0c48b96d3b8a88/VISIT-001/GATE_IN/3a9d705462164c0ebe6bd815f8b7f642/CAM-01_LEFT_20260915T082347241Z.webp',
              },
            ],
          },
        ],
      },
    ],
    page: 1,
    pageSize: 25,
    totalCount: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateEventsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    gateEventService = TestBed.inject(GateEventService);
    vi.spyOn(gateEventService, 'getVisits').mockReturnValue(of(mockVisitsResponse));
    fixture = TestBed.createComponent(GateEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the GateEventsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial metrics values', () => {
    const metrics = component.metrics();
    expect(metrics.todayArrivals).toBeGreaterThanOrEqual(0);
    expect(metrics.todayDepartures).toBeGreaterThanOrEqual(0);
  });

  it('should map and bind GET /api/v1/gate/visits API response correctly', () => {
    vi.spyOn(gateEventService, 'getVisits').mockReturnValue(of(mockVisitsResponse));
    component.loadGateEvents();

    const events = component.events();
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('VISIT-001');
    expect(events[0].containerNo).toBe('MSCU1234567');
    expect(events[0].confidence).toBe(95);
    expect(events[0].truckNo).toBe('MH12AB1234');
    expect(events[0].direction).toBe('IN');
    expect(events[0].status).toBe('Verified');
    expect(events[0].photos.length).toBeGreaterThan(0);
    expect(events[0].photos[0].url).toContain('CAM-01_LEFT_20260915T082347241Z.webp');
  });

  it('should filter events when switching tabs', () => {
    component.setActiveTab('arrivals');
    const arrivals = component.filteredEvents();
    expect(arrivals.every((e) => e.direction === 'IN')).toBe(true);

    component.setActiveTab('departures');
    const departures = component.filteredEvents();
    expect(departures.every((e) => e.direction === 'OUT')).toBe(true);
  });

  it('should toggle selection for individual and all rows', () => {
    expect(component.isAllSelected()).toBe(false);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(true);

    const firstId = component.paginatedEvents()[0].id;
    expect(component.isSelected(firstId)).toBe(true);

    component.toggleSelect(firstId);
    expect(component.isSelected(firstId)).toBe(false);
  });

  it('should open and close details modal', () => {
    const firstEvent = component.events()[0];
    component.openDetails(firstEvent);
    expect(component.selectedEventForDetails()).toEqual(firstEvent);

    component.closeDetails();
    expect(component.selectedEventForDetails()).toBeNull();
  });
});
