import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizationService } from 'core/services/localization.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly localizationService = inject(LocalizationService);

  public transform(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    return this.localizationService.translate(key, params);
  }
}
