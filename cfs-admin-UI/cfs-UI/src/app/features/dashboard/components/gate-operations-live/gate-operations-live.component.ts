import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GateLiveStageItem, GateTabInfo, NextTruckInfo } from 'shared/types/dashboard/dashboard.interface';

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
  public readonly gateInCount = input<number>(30);
  public readonly gateOutCount = input<number>(24);

  // Active operation mode tab: 'in' | 'out'
  public readonly activeMode = signal<'in' | 'out'>('in');

  // Stages computed dynamically: Gate Out shares the exact same 4 stages as Gate In (Arrived, OCR Scan, Verification, Gate Out) with Gate Out specific data
  public readonly activeStages = computed<GateLiveStageItem[]>(() => {
    if (this.activeMode() === 'out') {
      const outTotal = this.gateOutCount();
      return [
        {
          id: 'arrived-out',
          label: 'Arrived',
          count: outTotal,
          percentage: 54,
          trendText: '10%',
          trendDirection: 'positive',
          colorTheme: 'blue',
          iconType: 'truck-in',
        },
        {
          id: 'ocr-scan-out',
          label: 'OCR Scan',
          count: Math.max(1, Math.round(outTotal * 0.83)),
          percentage: 45,
          trendText: '7%',
          trendDirection: 'positive',
          colorTheme: 'amber',
          iconType: 'ocr-scan',
        },
        {
          id: 'verification-out',
          label: 'Verification',
          count: Math.max(1, Math.round(outTotal * 0.75)),
          percentage: 40,
          trendText: '4%',
          trendDirection: 'positive',
          colorTheme: 'blue',
          iconType: 'verification',
        },
        {
          id: 'gate-out-stage',
          label: 'Gate Out',
          count: Math.max(1, Math.round(outTotal * 0.58)),
          percentage: 30,
          trendText: '2%',
          trendDirection: 'positive',
          colorTheme: 'amber',
          iconType: 'gate-out',
        },
      ];
    }

    const inTotal = this.gateInCount();
    const incoming = this.stages();
    if (incoming && incoming.length > 0) {
      return incoming;
    }

    return [
      {
        id: 'arrived',
        label: 'Arrived',
        count: inTotal,
        percentage: 55,
        trendText: '12%',
        trendDirection: 'positive',
        colorTheme: 'blue',
        iconType: 'truck-in',
      },
      {
        id: 'ocr-scan',
        label: 'OCR Scan',
        count: Math.max(1, Math.round(inTotal * 0.93)),
        percentage: 51,
        trendText: '8%',
        trendDirection: 'positive',
        colorTheme: 'amber',
        iconType: 'ocr-scan',
      },
      {
        id: 'verification',
        label: 'Verification',
        count: Math.max(1, Math.round(inTotal * 0.73)),
        percentage: 40,
        trendText: '5%',
        trendDirection: 'positive',
        colorTheme: 'blue',
        iconType: 'verification',
      },
      {
        id: 'gate-in',
        label: 'Gate In',
        count: Math.max(1, Math.round(inTotal * 0.53)),
        percentage: 29,
        trendText: '2%',
        trendDirection: 'positive',
        colorTheme: 'amber',
        iconType: 'gate-in',
      },
    ];
  });

  public selectMode(mode: 'in' | 'out'): void {
    this.activeMode.set(mode);
    this.gateTabChange.emit(mode === 'in' ? 'gate-in' : 'gate-out');
  }

  public getStageWidth(stage: GateLiveStageItem): number {
    if (stage.count && stage.count > 0) {
      // Scale against standard max batch of 55 trucks for proportional width matching reference image
      return Math.min(100, Math.max(12, Math.round((stage.count / 55) * 100)));
    }
    return stage.percentage || 45;
  }
}
