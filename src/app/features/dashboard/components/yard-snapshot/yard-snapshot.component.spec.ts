import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { YardSnapshotComponent } from './yard-snapshot.component';
import { YardBlockRow, YardMetrics } from 'shared/types/dashboard/dashboard.interface';

describe('YardSnapshotComponent', () => {
  let component: YardSnapshotComponent;
  let fixture: ComponentFixture<YardSnapshotComponent>;

  const mockRows: YardBlockRow[] = [
    {
      rowLetter: 'A',
      bays: [
        { bayNumber: '01', slots: ['import', 'export', 'empty', 'hazard', 'maintenance', 'vacant'] },
      ],
    },
  ];

  const mockMetrics: YardMetrics = {
    totalBlocks: 12,
    totalRows: 24,
    teuCapacity: 2400,
    currentTeu: 1256,
    utilizationPercentage: 52,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YardSnapshotComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(YardSnapshotComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rows', mockRows);
    fixture.componentRef.setInput('metrics', mockMetrics);
    fixture.detectChanges();
  });

  it('should create and render yard matrix rows and metrics', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Yard Snapshot (Live)');
    expect(compiled.textContent).toContain('Blocks');
    expect(compiled.textContent).toContain('12');
    expect(compiled.textContent).toContain('52%');
  });
});
