import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { RecentGateActivityComponent } from './recent-gate-activity.component';
import { GateActivityItem } from 'shared/types/dashboard/dashboard.interface';

describe('RecentGateActivityComponent', () => {
  let component: RecentGateActivityComponent;
  let fixture: ComponentFixture<RecentGateActivityComponent>;

  const mockActivities: GateActivityItem[] = [
    {
      id: 'gate-1',
      time: '23 May, 10:24 AM',
      type: 'IN',
      truckNo: 'MH01AB1234',
      containerNo: 'MSCU 556123 4',
      sizeType: "40' HC",
      direction: 'Import',
      ocrResult: 'MSCU 556123 4',
      ocrConfidence: 99.2,
      status: 'Verified',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentGateActivityComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentGateActivityComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activities', mockActivities);
    fixture.detectChanges();
  });

  it('should create and render recent gate activity entries', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Recent Gate Activity');
    expect(compiled.textContent).toContain('MH01AB1234');
    expect(compiled.textContent).toContain('MSCU 556123 4');
    expect(compiled.textContent).toContain('99.2%');
    expect(compiled.textContent).toContain('Verified');
  });

  it('should emit page change event', () => {
    let emittedPage = 0;
    component.pageChange.subscribe((page) => (emittedPage = page));
    component.onSelectPage(3);
    expect(emittedPage).toBe(3);
  });
});
