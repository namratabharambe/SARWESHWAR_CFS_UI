import { Routes } from '@angular/router';
import { GateEventsComponent } from './gate-events.component';

export const GATE_EVENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'in',
  },
  {
    path: 'in',
    component: GateEventsComponent,
    data: { mode: 'in' },
  },
  {
    path: 'out',
    component: GateEventsComponent,
    data: { mode: 'out' },
  },
];
