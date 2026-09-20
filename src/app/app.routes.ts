import { Routes } from '@angular/router';
import { loginGuard } from 'core/guards/login.guard';
import { maintenanceGuard } from 'core/guards/maintenance-guard';
import { RootGuard } from 'core/guards/root.guard';
import { AppRoutes } from 'shared/constants/routes.const';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: AppRoutes.LOGIN,
    canActivate: [loginGuard],
    loadChildren: () => import('app/features/auth/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: AppRoutes.MAINTENANCE,
    loadComponent: () => import('core/maintenance/maintenance.component').then((m) => m.MaintenanceComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [maintenanceGuard, RootGuard],
    children: [
      {
        path: AppRoutes.DASHBOARD,
        loadChildren: () => import('app/features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: AppRoutes.CLIENTS,
        loadChildren: () => import('app/features/clients/clients.routes').then((m) => m.CLIENTS_ROUTES),
      },
      {
        path: AppRoutes.SITES,
        loadChildren: () => import('app/features/sites/sites.routes').then((m) => m.SITES_ROUTES),
      },
      {
        path: AppRoutes.USERS,
        loadChildren: () => import('app/features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
      {
        path: AppRoutes.ROLES,
        loadChildren: () => import('app/features/roles/roles.routes').then((m) => m.ROLES_ROUTES),
      },
      {
        path: AppRoutes.GATE_EVENTS,
        loadChildren: () => import('app/features/gate-events/gate-events.routes').then((m) => m.GATE_EVENTS_ROUTES),
      },
      {
        path: AppRoutes.TASKS,
        loadChildren: () => import('app/features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES),
      },
      {
        path: AppRoutes.INVENTORY,
        loadChildren: () => import('app/features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
      },
      {
        path: AppRoutes.REPORTS,
        loadChildren: () => import('app/features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: AppRoutes.ALERTS,
        loadChildren: () => import('app/features/alerts/alerts.routes').then((m) => m.ALERTS_ROUTES),
      },
      { path: '', pathMatch: 'full', redirectTo: AppRoutes.DASHBOARD },
    ],
  },
  { path: '**', redirectTo: '' },
];
