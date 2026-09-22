import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'core/auth/auth.service';

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.authenticated()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
