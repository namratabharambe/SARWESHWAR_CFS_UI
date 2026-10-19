import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from 'core/auth/auth.service';

const DEFAULT_FALLBACK_SITE_ID = '01a07fd0-d69a-7998-bd0c-48b96d3b8a88';
const DEFAULT_FALLBACK_CLIENT_ID = '01a07fcf-041d-74be-8d8f-14e12d9e471b';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_admin_token') : null;

  // Do not attach authorization or tenant context headers to public auth endpoints
  const isAuthRequest =
    request.url.includes('/auth/login') ||
    request.url.includes('/auth/refresh') ||
    request.url.includes('/auth/forgot-password') ||
    request.url.includes('/auth/reset-password');

  if (isAuthRequest || auth.isBypassMode()) {
    return next(request);
  }

  // Helper to attach authorization & tenant context headers
  const buildAuthorizedRequest = (authToken: string | null) => {
    const setHeaders: Record<string, string> = {};

    if (authToken) {
      setHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    // Resolve effective siteId from headers, query params, auth service, sessionStorage, or default fallback
    const siteId =
      request.headers.get('X-Site-Id') ||
      request.headers.get('x-site-id') ||
      request.headers.get('Site-ID') ||
      request.headers.get('site-id') ||
      request.params.get('siteId') ||
      request.params.get('SiteId') ||
      auth.getActiveSiteId() ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_selected_site_id') : '') ||
      DEFAULT_FALLBACK_SITE_ID;

    // Resolve effective clientId from headers, query params, auth service, sessionStorage, or default fallback
    const clientId =
      request.headers.get('X-Client-Id') ||
      request.headers.get('x-client-id') ||
      request.params.get('clientId') ||
      request.params.get('ClientId') ||
      auth.getActiveClientId() ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_selected_client_id') : '') ||
      DEFAULT_FALLBACK_CLIENT_ID;

    if (siteId && siteId.trim().length > 0) {
      setHeaders['X-Site-Id'] = siteId.trim();
    }
    if (clientId && clientId.trim().length > 0) {
      setHeaders['X-Client-Id'] = clientId.trim();
    }

    return Object.keys(setHeaders).length > 0 ? request.clone({ setHeaders }) : request;
  };

  // If token is already expired and we have a refresh token, refresh before sending request
  if (token && auth.isTokenExpired() && auth.hasRefreshToken()) {
    return auth.refreshSession().pipe(
      switchMap((newToken) => {
        const authReq = buildAuthorizedRequest(newToken);
        return next(authReq);
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  // If token is already expired and NO refresh token exists, trigger session expiration
  if (token && auth.isTokenExpired() && !auth.hasRefreshToken()) {
    auth.triggerSessionExpired();
  }

  const initialReq = buildAuthorizedRequest(token);

  return next(initialReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // On 401 Unauthorized, if refresh token exists, refresh token and retry the original request
      if (error.status === 401 && auth.hasRefreshToken()) {
        return auth.refreshSession().pipe(
          switchMap((newToken) => {
            const retriedReq = buildAuthorizedRequest(newToken);
            return next(retriedReq);
          }),
          catchError((refreshErr) => {
            return throwError(() => refreshErr);
          }),
        );
      }

      // If 401 Unauthorized without refresh token, trigger session expired
      if (error.status === 401 && !auth.hasRefreshToken()) {
        auth.triggerSessionExpired();
      }

      return throwError(() => error);
    }),
  );
};
