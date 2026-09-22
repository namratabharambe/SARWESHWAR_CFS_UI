import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = sessionStorage.getItem('cfs_admin_token');

  // If token is already expired and user is navigating/requesting API, trigger session expiration
  if (token && !request.url.includes('/auth/login') && auth.isTokenExpired()) {
    auth.triggerSessionExpired();
  }

  const authReq = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Trigger session expired popup on 401 Unauthorized on protected endpoints
      if (error.status === 401 && !request.url.includes('/auth/login')) {
        auth.triggerSessionExpired();
      }
      return throwError(() => error);
    }),
  );
};
