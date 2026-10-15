import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { BaseApiService } from 'shared/services/base-api.service';
import { ApiUrlService } from 'core/services/api.url.service';
import { Role } from 'shared/types/role/role.interface';

@Injectable({ providedIn: 'root' })
export class RoleService extends BaseApiService<Role[], Role, Role> {
  constructor(http: HttpClient) {
    super(http, inject(ApiUrlService).apiUrl);
  }

  public override controllerName(): string {
    return 'roles';
  }

  public listRoles(): Observable<Role[]> {
    return this.get().pipe(catchError(() => of([])));
  }
}
