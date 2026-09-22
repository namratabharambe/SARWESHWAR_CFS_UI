import { signal } from '@angular/core';
import { of, Observable } from 'rxjs';
import { Client, Site, Role, User } from 'core/models/admin.models';

export class MockAdminRepository {
  public readonly clients = signal<Client[]>([
    {
      id: '1',
      name: 'Acme Corp',
      clientName: 'Acme Corp',
      code: 'ACM',
      status: 'Active',
      active: true,
      isActive: true,
    },
  ]);
  public readonly sites = signal<Site[]>([
    { id: 's1', clientId: '1', name: 'Main Yard', code: 'MY1', status: 'Active', active: true, isActive: true },
  ]);
  public readonly roles = signal<Role[]>([
    { id: 'r1', name: 'SystemAdmin', description: 'Full system control', level: 'Client' },
  ]);
  public readonly users = signal<User[]>([
    {
      id: 'u1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@acme.com',
      status: 'Active',
      active: true,
      isActive: true,
    },
  ]);
  public readonly loading = signal<boolean>(false);
  public readonly error = signal<string>('');

  public loadAll(): void {}
  public loadClients(): void {}
  public loadSites(): void {}
  public loadUsers(): void {}

  public getSitesByClientId(clientId?: string): Observable<Site[]> {
    if (!clientId) return of(this.sites());
    const matches = this.sites().filter((s) => s.clientId === clientId);
    return of(matches.length > 0 ? matches : this.sites());
  }

  public getUsers(): Observable<User[]> {
    return of(this.users());
  }

  public saveClient(c: any): Observable<Client> {
    return of({
      id: c.id || 'new-id',
      name: c.clientName,
      clientName: c.clientName,
      status: 'Active',
      active: true,
      isActive: true,
    });
  }

  public patchClientActive(): Observable<void> {
    return of(undefined);
  }

  public saveSite(s: any): Observable<Site> {
    return of({
      id: s.id || 'new-s-id',
      clientId: s.clientId,
      name: s.name,
      code: s.code,
      status: 'Active',
      active: true,
      isActive: true,
    });
  }

  public patchSiteActive(): Observable<void> {
    return of(undefined);
  }

  public saveRole(): void {}

  public saveUser(u: any): Observable<User> {
    return of({
      id: u.id || 'new-u-id',
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      status: 'Active',
      active: true,
      isActive: true,
    });
  }

  public deleteUser(): Observable<void> {
    return of(undefined);
  }

  public delete(): void {}

  public extractErrorMessage(err: any, fallback: string): string {
    return fallback;
  }
}
