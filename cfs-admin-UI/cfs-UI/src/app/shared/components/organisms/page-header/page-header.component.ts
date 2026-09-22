import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  public readonly breadcrumbs = input<BreadcrumbItem[]>([]);
  public readonly title = input.required<string>();
  public readonly subtitle = input<string>('');
  public readonly actionLabel = input<string>('');
  public readonly actionIcon = input<string>('add');
  public readonly action = output<void>();

  public onAction(): void {
    this.action.emit();
  }
}
