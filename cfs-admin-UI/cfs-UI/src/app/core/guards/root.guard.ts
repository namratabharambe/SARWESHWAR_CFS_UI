import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'core/auth/auth.service';

export const RootGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If not authenticated, redirect to /login
  if (!auth.authenticated()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};

export const rootGuard = RootGuard;
