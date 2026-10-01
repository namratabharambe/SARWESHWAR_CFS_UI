import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
  },
  {
    path: 'sites',
    loadChildren: () => import('../sites/sites.routes').then((m) => m.SITES_ROUTES),
  },
  {
    path: 'users',
    loadChildren: () => import('../users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'roles',
    loadChildren: () => import('../roles/roles.routes').then((m) => m.ROLES_ROUTES),
  },
];
