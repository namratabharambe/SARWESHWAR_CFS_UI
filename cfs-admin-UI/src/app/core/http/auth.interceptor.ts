import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_admin_token') : null;
  const isAuthRequest = request.url.includes('/auth/login') || request.url.includes('/auth/refresh');

  if (isAuthRequest || auth.isBypassMode()) {
    return next(request);
  }

  if (token && auth.isTokenExpired() && auth.hasRefreshToken()) {
    return auth.refreshSession().pipe(
      switchMap((newToken) => {
        const authReq = request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
        return next(authReq);
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  const authReq = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.hasRefreshToken()) {
        return auth.refreshSession().pipe(
          switchMap((newToken) => {
            const retriedReq = request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retriedReq);
          }),
          catchError((refreshErr) => throwError(() => refreshErr)),
        );
      }
      if (error.status === 401 && !auth.hasRefreshToken()) {
        auth.triggerSessionExpired();
      }
      return throwError(() => error);
    }),
  );
};
