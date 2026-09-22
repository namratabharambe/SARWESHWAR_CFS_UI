import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from 'core/auth/auth.service';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = sessionStorage.getItem('cfs_admin_token');
  const clientId = auth.getActiveClientId();
  const siteId = auth.getActiveSiteId();

  // If token is already expired and user is requesting protected API, trigger session expiration
  if (token && !request.url.includes('/auth/login') && auth.isTokenExpired()) {
    auth.triggerSessionExpired();
  }

  const setHeaders: Record<string, string> = {};
  if (token) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }
  if (siteId) {
    setHeaders['Site-ID'] = siteId;
    setHeaders['X-Site-Id'] = siteId;
  }
  if (clientId) {
    setHeaders['X-Client-Id'] = clientId;
  }

  const authReq = Object.keys(setHeaders).length > 0 ? request.clone({ setHeaders }) : request;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !request.url.includes('/auth/login')) {
        auth.triggerSessionExpired();
      }
      return throwError(() => error);
    }),
  );
};
