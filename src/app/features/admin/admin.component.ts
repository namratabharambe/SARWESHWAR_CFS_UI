import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'shared/components/organisms/page-header/page-header.component';

interface AdminModuleCard {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  accentColor: 'blue' | 'teal' | 'purple';
  badge?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  public readonly adminCards: AdminModuleCard[] = [
    {
      id: 'sites',
      title: 'Sites',
      description: 'Manage container freight station sites, regional hubs and client assignments.',
      route: '/sites',
      icon: 'domain',
      accentColor: 'blue',
    },
    {
      id: 'users',
      title: 'Users',
      description: 'Manage administrators, operators, site personnel and access credentials.',
      route: '/users',
      icon: 'people',
      accentColor: 'teal',
    },
    {
      id: 'roles',
      title: 'Roles & Permissions',
      description: 'Configure role-based access control, scopes and administrative privileges.',
      route: '/roles',
      icon: 'verified_user',
      accentColor: 'purple',
    },
  ];
}
