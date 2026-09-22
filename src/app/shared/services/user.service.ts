import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from 'shared/services/base-api.service';
import { ApiUrlService } from 'core/services/api.url.service';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  AssignClientRoleRequest,
  AssignSiteRoleRequest,
} from 'shared/types/user/user.interface';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseApiService<User[], User, CreateUserRequest | UpdateUserRequest> {
  constructor(http: HttpClient) {
    super(http, inject(ApiUrlService).apiUrl);
  }

  public override controllerName(): string {
    return 'users';
  }

  public listUsers(clientId?: string, siteId?: string): Observable<User[]> {
    let params = new HttpParams();
    if (clientId) {
      params = params.set('ClientId', clientId);
    }
    if (siteId) {
      params = params.set('SiteId', siteId);
    }
    return this.get({ params });
  }

  public getUserById(id: string): Observable<User> {
    return this.getById(id);
  }

  public createUser(request: CreateUserRequest): Observable<User> {
    const payload: any = {
      UserName: request.UserName ?? request.userName,
      Password: request.Password ?? request.password,
      FirstName: request.FirstName ?? request.firstName,
      LastName: request.LastName ?? request.lastName,
      Email: request.Email ?? request.email ?? null,
      MobileNumber: request.MobileNumber ?? request.mobileNumber ?? null,
    };

    const clientId = request.ClientId ?? request.clientId;
    if (clientId) payload.ClientId = clientId;

    const siteId = request.SiteId ?? request.siteId;
    if (siteId) payload.SiteId = siteId;

    const role = request.Role ?? request.role;
    if (role) payload.Role = role;

    const siteRoles = request.SiteRoles ?? request.siteRoles;
    if (siteRoles && siteRoles.length > 0) {
      payload.SiteRoles = siteRoles.map((sr) => ({
        SiteId: sr.SiteId ?? sr.siteId,
        Role: sr.Role ?? sr.role,
      }));
    }

    return this.http.post<User>(this.endpointUrl, payload);
  }

  public updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    const payload: any = {
      FirstName: request.FirstName ?? request.firstName,
      LastName: request.LastName ?? request.lastName,
      Email: request.Email ?? request.email ?? null,
      MobileNumber: request.MobileNumber ?? request.mobileNumber ?? null,
    };

    const siteRoles = request.SiteRoles ?? request.siteRoles;
    if (siteRoles && siteRoles.length > 0) {
      payload.SiteRoles = siteRoles.map((sr) => ({
        SiteId: sr.SiteId ?? sr.siteId,
        Role: sr.Role ?? sr.role,
      }));
    }

    return this.http.put<User>(`${this.endpointUrl}/${id}`, payload);
  }

  public setActive(userId: string, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.endpointUrl}/${userId}/active/${active}`, {});
  }

  public setSystemAdmin(userId: string, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.endpointUrl}/${userId}/system-admin/${active}`, {});
  }

  public assignClientRole(userId: string, request: AssignClientRoleRequest): Observable<void> {
    const payload = {
      ClientId: request.ClientId ?? request.clientId,
      Role: request.Role ?? request.role,
    };
    return this.http.post<void>(`${this.endpointUrl}/${userId}/client-roles`, payload);
  }

  public removeClientRole(userId: string, clientId: string, role: string): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${userId}/client-roles/${clientId}/${encodeURIComponent(role)}`);
  }

  public assignSiteRole(userId: string, request: AssignSiteRoleRequest): Observable<void> {
    const payload = {
      SiteId: request.SiteId ?? request.siteId,
      Role: request.Role ?? request.role,
    };
    return this.http.post<void>(`${this.endpointUrl}/${userId}/site-roles`, payload);
  }

  public removeSiteRole(userId: string, siteId: string, role: string): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${userId}/site-roles/${siteId}/${encodeURIComponent(role)}`);
  }
}
