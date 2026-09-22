import { Injectable, signal, computed } from '@angular/core';
import { DashboardService } from 'app/features/dashboard/services/dashboard.service';

@Injectable({
  providedIn: 'root',
})
export class MockDashboardService extends DashboardService {
  // Override or add mock behaviors if needed
}
