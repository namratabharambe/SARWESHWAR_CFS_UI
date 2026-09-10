import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export abstract class BaseApiService<T, T1 = T, T2 = T1> {
  protected constructor(
    protected readonly http: HttpClient,
    protected readonly baseUrl: string,
  ) {}

  public abstract controllerName(): string;

  protected get endpointUrl(): string {
    return `${this.baseUrl}/${this.controllerName()}`;
  }

  public get(options?: {
    params?: HttpParams | { [param: string]: string | number | boolean | readonly (string | number | boolean)[] };
  }): Observable<T> {
    return this.http.get<T>(this.endpointUrl, options);
  }

  public getById(id: string | number): Observable<T1> {
    return this.http.get<T1>(`${this.endpointUrl}/${id}`);
  }

  public insert(entity: T2): Observable<T1> {
    return this.http.post<T1>(this.endpointUrl, entity);
  }

  public update(id: string | number, entity: T2): Observable<T1> {
    return this.http.put<T1>(`${this.endpointUrl}/${id}`, entity);
  }

  public patch(patches: Partial<T2>): Observable<T1> {
    return this.http.patch<T1>(this.endpointUrl, patches);
  }

  public patchById(id: string | number, patches: Partial<T2>): Observable<T1> {
    return this.http.patch<T1>(`${this.endpointUrl}/${id}`, patches);
  }

  public delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${id}`);
  }
}
