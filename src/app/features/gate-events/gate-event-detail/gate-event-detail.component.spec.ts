import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GateEventDetailComponent } from './gate-event-detail.component';
import { GateEventItem } from '../gate-events.component';

describe('GateEventDetailComponent', () => {
  let component: GateEventDetailComponent;
  let fixture: ComponentFixture<GateEventDetailComponent>;

  const mockEvent: GateEventItem = {
    id: 'evt-01',
    eventTime: '17 May 2025, 10:24 AM',
    timestamp: 1747473840000,
    gate: 'GATE-01',
    direction: 'IN',
    truckNo: 'MH12 AB 1234',
    containerNo: 'MSCU 556123 4',
    ocrResult: 'MSCU 556123 4',
    confidence: 98,
    driver: 'Ramesh Kumar',
    status: 'Verified',
    damageFlag: false,
    photos: [
      { label: 'Front OCR', color: '#c9842a', tag: 'MSC' },
      { label: 'Left Side ISO', color: '#c9842a', tag: 'MSC' },
      { label: 'Right Side ISO', color: '#c9842a', tag: 'MSC' },
      { label: 'Rear Doors', color: '#c9842a', tag: 'MSC' },
    ],
    notes: 'No issues found',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateEventDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GateEventDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('event', mockEvent);
    fixture.detectChanges();
  });

  it('should create GateEventDetailComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should format event details accurately from input', () => {
    const detail = component.detail();
    expect(detail.eventId).toBe('GE-2025-05-17-000001');
    expect(detail.truckNo).toBe('MH12AB1234');
    expect(detail.containerNo).toBe('MSCU5561234');
    expect(detail.gate).toBe('Gate 1');
    expect(detail.overallConfidence).toBe(98);
    expect(detail.capturedPhotos.length).toBe(4);
    expect(detail.timelineSteps.length).toBe(4);
  });

  it('should emit back event when onBack is called', () => {
    let emitted = false;
    component.back.subscribe(() => {
      emitted = true;
    });

    component.onBack();
    expect(emitted).toBe(true);
  });

  it('should emit approve event with event data', () => {
    let emittedEvent: GateEventItem | null = null;
    component.approve.subscribe((e) => {
      emittedEvent = e;
    });

    component.onApprove();
    expect(emittedEvent).toEqual(mockEvent);
  });

  it('should emit markException event with event data', () => {
    let emittedEvent: GateEventItem | null = null;
    component.markException.subscribe((e) => {
      emittedEvent = e;
    });

    component.onMarkException();
    expect(emittedEvent).toEqual(mockEvent);
  });

  it('should emit reRunOcr event with event data', () => {
    let emittedEvent: GateEventItem | null = null;
    component.reRunOcr.subscribe((e) => {
      emittedEvent = e;
    });

    component.onReRunOcr();
    expect(emittedEvent).toEqual(mockEvent);
  });

  it('should emit createTask event with event data', () => {
    let emittedEvent: GateEventItem | null = null;
    component.createTask.subscribe((e) => {
      emittedEvent = e;
    });

    component.onCreateTask();
    expect(emittedEvent).toEqual(mockEvent);
  });

  it('should open and close lightbox modal', () => {
    expect(component.activeLightboxPhoto()).toBeNull();

    component.openLightbox('Front Photo', '/assets/gate/front-gate.jpg');
    expect(component.activeLightboxPhoto()).toEqual({
      title: 'Front Photo',
      url: '/assets/gate/front-gate.jpg',
    });

    component.closeLightbox();
    expect(component.activeLightboxPhoto()).toBeNull();
  });
});
