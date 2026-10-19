import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GateLiveStageItem, GateTabInfo, NextTruckInfo } from 'shared/types/dashboard/dashboard.interface';
import { GateCountsResponse } from 'shared/types/gate-event/gate-event.interface';

@Component({
  selector: 'app-gate-operations-live',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gate-operations-live.component.html',
  styleUrls: ['./gate-operations-live.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GateOperationsLiveComponent {
  // Inputs maintained for backward-compatibility with dashboard service & parent templates
  public readonly tabs = input<GateTabInfo[]>([]);
  public readonly stages = input<GateLiveStageItem[]>([]);
  public readonly nextTruck = input<NextTruckInfo>();
  public readonly selectedGateId = input<string>('gate-1');
  public readonly gateTabChange = output<string>();

  // Custom counts for Gate In and Gate Out tabs
  public readonly gateInCount = input<number>(0);
  public readonly gateOutCount = input<number>(0);
  public readonly gateCounts = input<GateCountsResponse | null>(null);

  // Active operation mode tab: 'in' | 'out'
  public readonly activeMode = signal<'in' | 'out'>('in');

  // Stages computed dynamically based on total gate in / total gate out:
  // In Gate Out: "Arrival" replaced by "Departure", and "Gate Out" removed from poll
  // In Gate In: "Gate In" removed from poll
  public readonly activeStages = computed<GateLiveStageItem[]>(() => {
    const counts = this.gateCounts();
    if (this.activeMode() === 'out') {
      const outTotal = this.gateOutCount();
      const ocrOut = counts?.GateOutocrVerifiedCount ?? counts?.gateOutocrVerifiedCount ?? Math.max(0, Math.round(outTotal * 0.83));
      return [
        {
          id: 'departure-out',
          label: 'Departure',
          count: outTotal,
          percentage: 85,
          trendText: '10%',
          trendDirection: 'positive',
          colorTheme: 'blue',
          iconType: 'truck-out',
        },
        {
          id: 'ocr-scan-out',
          label: 'OCR Scan',
          count: ocrOut,
          percentage: 75,
          trendText: '7%',
          trendDirection: 'positive',
          colorTheme: 'amber',
          iconType: 'ocr-scan',
        },
        {
          id: 'verification-out',
          label: 'Verification',
          count: ocrOut,
          percentage: 65,
          trendText: '4%',
          trendDirection: 'positive',
          colorTheme: 'blue',
          iconType: 'verification',
        },
      ];
    }

    const inTotal = this.gateInCount();
    const ocrIn = counts?.GateinocrVerifiedCount ?? counts?.gateInocrVerifiedCount ?? Math.max(0, Math.round(inTotal * 0.9));
    return [
      {
        id: 'arrived',
        label: 'Arrived',
        count: inTotal,
        percentage: 85,
        trendText: '12%',
        trendDirection: 'positive',
        colorTheme: 'blue',
        iconType: 'truck-in',
      },
      {
        id: 'ocr-scan',
        label: 'OCR Scan',
        count: ocrIn,
        percentage: 75,
        trendText: '8%',
        trendDirection: 'positive',
        colorTheme: 'amber',
        iconType: 'ocr-scan',
      },
      {
        id: 'verification',
        label: 'Verification',
        count: ocrIn,
        percentage: 65,
        trendText: '5%',
        trendDirection: 'positive',
        colorTheme: 'blue',
        iconType: 'verification',
      },
    ];
  });

  public selectMode(mode: 'in' | 'out'): void {
    this.activeMode.set(mode);
    this.gateTabChange.emit(mode === 'in' ? 'gate-in' : 'gate-out');
  }

  public getStageWidth(stage: GateLiveStageItem): number {
    const total = this.activeMode() === 'out' ? this.gateOutCount() : this.gateInCount();
    if (total > 0 && typeof stage.count === 'number') {
      const ratio = stage.count / total;
      return Math.min(100, Math.max(20, Math.round(ratio * 92)));
    }
    return stage.percentage || 50;
  }
}
