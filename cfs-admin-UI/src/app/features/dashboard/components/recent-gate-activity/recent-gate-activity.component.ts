import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, afterNextRender, computed, inject, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GateActivityItem, GateItemStatus } from 'shared/types/dashboard/dashboard.interface';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-recent-gate-activity',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-gate-activity.component.html',
  styleUrls: ['./recent-gate-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentGateActivityComponent {
  private readonly dashboardService = inject(DashboardService);

  public readonly activities = input.required<GateActivityItem[]>();
  /** Latest 20 events; the card auto-scrolls through them. */
  public readonly latest = computed(() => this.activities().slice(0, 20));
  /** Only loop (render twice) when there are enough rows to overflow the card. */
  public readonly scrolling = computed(() => this.latest().length > 4);
  public readonly passes = computed(() => (this.scrolling() ? [0, 1] : [0]));

  private readonly feed = viewChild<ElementRef<HTMLElement>>('feed');
  /** Auto-scroll speed in px/second. */
  private static readonly SPEED = 22;
  public paused = false;
  private pos = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let last = performance.now();
      let raf = requestAnimationFrame(function tick(now: number) {
        step(now);
        raf = requestAnimationFrame(tick);
      });
      const step = (now: number) => {
        const dt = Math.min(now - last, 100) / 1000;
        last = now;
        const el = this.feed()?.nativeElement;
        if (!el || this.paused || !this.scrolling()) return;
        const half = el.scrollHeight / 2;
        this.pos += dt * RecentGateActivityComponent.SPEED;
        if (this.pos >= half) this.pos -= half;
        el.scrollTop = this.pos;
      };
      destroyRef.onDestroy(() => cancelAnimationFrame(raf));
    });
  }

  /** Continue from wherever the user left the scrollbar. */
  public resume(): void {
    this.pos = this.feed()?.nativeElement.scrollTop ?? 0;
    this.paused = false;
  }

  public statusLabel(status: GateItemStatus): string {
    return status === 'Review' ? 'Needs Review' : status === 'Flagged' ? 'Exception' : status;
  }

  public statusTone(status: GateItemStatus): string {
    return status === 'Review' ? 'st-warn' : status === 'Flagged' ? 'st-bad' : status === 'Processing' ? 'st-info' : 'st-good';
  }

  public date(item: GateActivityItem): string {
    return item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  }

  public readonly selectedActivity = this.dashboardService.selectedGateActivity;

  public openPreview(item: GateActivityItem, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.dashboardService.openActivityPreview(item);
  }

  public openLatestPreview(): void {
    const items = this.latest();
    if (items.length > 0) {
      this.dashboardService.openActivityPreview(items[0]);
    }
  }

  public closePreview(): void {
    this.dashboardService.closeActivityPreview();
  }

  @HostListener('window:keydown.escape')
  public onEscKey(): void {
    if (this.selectedActivity()) {
      this.closePreview();
    }
  }
}

