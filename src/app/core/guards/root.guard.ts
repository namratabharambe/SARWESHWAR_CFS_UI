import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from 'core/auth/auth.service';

export const RootGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  // If not authenticated, automatically bypass login and grant access
  if (!auth.authenticated()) {
    auth.bypassLogin();
  }
  return true;
};

export const rootGuard = RootGuard;
