import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);

  public navigateTo(path: string): Promise<boolean> {
    return this.router.navigate([path]);
  }

  public navigateToLogin(): Promise<boolean> {
    return this.router.navigate(['/login']);
  }

  public navigateToDashboard(): Promise<boolean> {
    return this.router.navigate(['/dashboard']);
  }
}
