import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from 'core/auth/auth.service';

const DEFAULT_FALLBACK_SITE_ID = '01a07fd0-d69a-7998-bd0c-48b96d3b8a88';
const DEFAULT_FALLBACK_CLIENT_ID = '01a07fcf-041d-74be-8d8f-14e12d9e471b';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cfs_admin_token') : null;

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

  // If token is already expired and user is requesting protected API, trigger session expiration
  if (token && !request.url.includes('/auth/login') && !auth.isBypassMode() && auth.isTokenExpired()) {
    auth.triggerSessionExpired();
  }

  const setHeaders: Record<string, string> = {};
  if (token) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }
  if (siteId && siteId.trim().length > 0) {
    setHeaders['Site-ID'] = siteId.trim();
    setHeaders['X-Site-Id'] = siteId.trim();
  }
  if (clientId && clientId.trim().length > 0) {
    setHeaders['X-Client-Id'] = clientId.trim();
  }

  const authReq = Object.keys(setHeaders).length > 0 ? request.clone({ setHeaders }) : request;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !request.url.includes('/auth/login') && !auth.isBypassMode()) {
        auth.triggerSessionExpired();
      }
      return throwError(() => error);
    }),
  );
};
