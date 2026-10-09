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
  public readonly gateInCount = input<number>(0);
  public readonly gateOutCount = input<number>(0);

  // Active operation mode tab: 'in' | 'out'
  public readonly activeMode = signal<'in' | 'out'>('in');

  // Stages computed dynamically: Gate Out has Departed in place of Arrived, with counts from Gate In & Gate Out
  public readonly activeStages = computed<GateLiveStageItem[]>(() => {
    if (this.activeMode() === 'out') {
      const outTotal = this.gateOutCount();
      return [
        {
          id: 'departed-out',
          label: 'Departed',
          count: outTotal,
          percentage: outTotal > 0 ? 100 : 0,
          trendText: '10%',
          trendDirection: 'positive',
          colorTheme: 'blue',
          iconType: 'truck-out',
        },
        {
          id: 'ocr-scan-out',
          label: 'OCR Scan',
          count: outTotal > 0 ? Math.round(outTotal * 0.83) : 0,
          percentage: 45,
          trendText: '7%',
          trendDirection: 'positive',
          colorTheme: 'amber',
          iconType: 'ocr-scan',
        },
        {
          id: 'verification-out',
          label: 'Verification',
          count: outTotal > 0 ? Math.round(outTotal * 0.75) : 0,
          percentage: 40,
          trendText: '4%',
          trendDirection: 'positive',
          colorTheme: 'blue',
          iconType: 'verification',
        },
        {
          id: 'gate-out-stage',
          label: 'Gate Out',
          count: outTotal > 0 ? Math.round(outTotal * 0.58) : 0,
          percentage: 30,
          trendText: '2%',
          trendDirection: 'positive',
          colorTheme: 'amber',
          iconType: 'gate-out',
        },
      ];
    }

    const inTotal = this.gateInCount();
    return [
      {
        id: 'arrived',
        label: 'Arrived',
        count: inTotal,
        percentage: inTotal > 0 ? 100 : 0,
        trendText: '12%',
        trendDirection: 'positive',
        colorTheme: 'blue',
        iconType: 'truck-in',
      },
      {
        id: 'ocr-scan',
        label: 'OCR Scan',
        count: inTotal > 0 ? Math.round(inTotal * 0.93) : 0,
        percentage: 51,
        trendText: '8%',
        trendDirection: 'positive',
        colorTheme: 'amber',
        iconType: 'ocr-scan',
      },
      {
        id: 'verification',
        label: 'Verification',
        count: inTotal > 0 ? Math.round(inTotal * 0.73) : 0,
        percentage: 40,
        trendText: '5%',
        trendDirection: 'positive',
        colorTheme: 'blue',
        iconType: 'verification',
      },
      {
        id: 'gate-in',
        label: 'Gate In',
        count: inTotal > 0 ? Math.round(inTotal * 0.53) : 0,
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
    const total = this.activeMode() === 'out' ? this.gateOutCount() : this.gateInCount();
    if (!stage.count || stage.count <= 0) {
      return 0;
    }
    if (total > 0) {
      return Math.min(100, Math.max(12, Math.round((stage.count / total) * 100)));
    }
    return stage.percentage || 0;
  }
}
