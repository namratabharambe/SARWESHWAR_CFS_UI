import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GateEventsComponent } from './gate-events.component';

describe('GateEventsComponent', () => {
  let component: GateEventsComponent;
  let fixture: ComponentFixture<GateEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateEventsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GateEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the GateEventsComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct initial metrics values matching the reference UI', () => {
    const metrics = component.metrics();
    expect(metrics.todayArrivals).toBe(28);
    expect(metrics.todayDepartures).toBe(22);
    expect(metrics.ocrVerified).toBe(76);
    expect(metrics.pendingReview).toBe(12);
    expect(metrics.damagedCaptures).toBe(5);
  });

  it('should filter events when switching tabs', () => {
    component.setActiveTab('arrivals');
    const arrivals = component.filteredEvents();
    expect(arrivals.every((e) => e.direction === 'IN')).toBe(true);

    component.setActiveTab('departures');
    const departures = component.filteredEvents();
    expect(departures.every((e) => e.direction === 'OUT')).toBe(true);

    component.setActiveTab('all');
    expect(component.filteredEvents().length).toBeGreaterThan(0);
  });

  it('should filter events by search query', () => {
    component.searchQuery.set('MSCU');
    const results = component.filteredEvents();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].containerNo).toContain('MSCU');

    component.searchQuery.set('Ramesh');
    const driverResults = component.filteredEvents();
    expect(driverResults.length).toBeGreaterThan(0);
    expect(driverResults[0].driver).toContain('Ramesh');
  });

  it('should toggle selection for individual and all rows', () => {
    expect(component.isAllSelected()).toBe(false);

    component.toggleSelectAll();
    expect(component.isAllSelected()).toBe(true);
    expect(component.selectedIds().size).toBeGreaterThan(0);

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

  it('should approve selected events and update their status to Verified', () => {
    const reviewEvent = component.events().find((e) => e.status === 'Review');
    if (reviewEvent) {
      component.toggleSelect(reviewEvent.id);
      component.approveSelected();
      const updated = component.events().find((e) => e.id === reviewEvent.id);
      expect(updated?.status).toBe('Verified');
    }
  });

  it('should have 4 camera photos per gate event', () => {
    const events = component.events();
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.photos.length === 4)).toBe(true);
  });
});
