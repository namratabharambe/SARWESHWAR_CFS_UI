import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface GateCameraPhoto {
  label: string;
  color: string;
  tag: string;
}

@Component({
  selector: 'app-gate-photo-strip',
  standalone: true,
  templateUrl: './gate-photo-strip.component.html',
  styleUrls: ['./gate-photo-strip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GatePhotoStripComponent {
  public readonly photos = input<GateCameraPhoto[]>([]);
  public readonly maxPhotos = input<number>(4);
  public readonly interactive = input<boolean>(true);

  public readonly photoClick = output<{ photo: GateCameraPhoto; index: number }>();

  public readonly visiblePhotos = computed<GateCameraPhoto[]>(() => {
    return this.photos().slice(0, this.maxPhotos());
  });

  public onPhotoClick(photo: GateCameraPhoto, index: number, event: MouseEvent): void {
    if (this.interactive()) {
      this.photoClick.emit({ photo, index });
    }
  }
}
