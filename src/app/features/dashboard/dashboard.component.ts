import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminRepository } from 'core/data/admin.repository';
import { PageHeaderComponent } from 'shared/components/organisms/page-header/page-header.component';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  public readonly repo = inject(AdminRepository);

  public readonly breadcrumbs = [{ label: 'Home', url: '/dashboard' }, { label: 'Dashboard' }];
}
