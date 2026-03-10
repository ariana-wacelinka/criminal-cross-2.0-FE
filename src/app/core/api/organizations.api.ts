import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ApiResponse, Organization, PageResult } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { API_MOCK_MODE } from '../http';
import { toHttpParams } from '../http/http-params.util';

const MOCK_ORGANIZATIONS: Organization[] = [
  'Athlium Norte',
  'Athlium Centro',
  'Athlium Sur',
  'Partner Recoleta',
  'Athlium Caballito',
  'Athlium Belgrano',
  'Athlium Palermo',
  'Athlium Almagro',
  'Athlium Quilmes',
  'Athlium La Plata',
  'Athlium Rosario',
  'Athlium Cordoba',
  'Athlium Mendoza',
  'Athlium Tucuman',
  'Partner San Isidro',
  'Partner Pilar',
  'Partner Mar del Plata',
  'Partner Neuquen',
  'Athlium Microcentro',
  'Athlium Devoto',
  'Athlium Flores',
  'Athlium Moron',
  'Athlium Lomas',
  'Athlium San Telmo',
].map((name, index) => ({ id: index + 1, name }));

export interface UpsertOrganizationRequest {
  name: string;
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

function normalizeOrganizationsPage(
  response: PageResult<Organization> | Organization[],
  page: number,
  size: number,
): PageResult<Organization> {
  const safePage = Math.max(0, page);
  const safeSize = Math.max(1, size);

  if (Array.isArray(response)) {
    const start = safePage * safeSize;
    return {
      items: response.slice(start, start + safeSize),
      total: response.length,
      page: safePage,
      size: safeSize,
    };
  }

  return {
    items: response.items ?? [],
    total: response.total ?? 0,
    page: response.page ?? safePage,
    size: response.size ?? safeSize,
  };
}

@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiMockMode = inject(API_MOCK_MODE);

  getPage(page: number, size: number): Observable<PageResult<Organization>> {
    if (this.apiMockMode) {
      const safePage = Math.max(0, page);
      const safeSize = Math.max(1, size);
      const start = safePage * safeSize;
      const items = MOCK_ORGANIZATIONS.slice(start, start + safeSize);
      return of({
        items,
        total: MOCK_ORGANIZATIONS.length,
        page: safePage,
        size: safeSize,
      });
    }

    return this.http
      .get<
        | ApiResponse<PageResult<Organization> | Organization[]>
        | PageResult<Organization>
        | Organization[]
      >(`${this.baseUrl}/organizations`, {
        params: toHttpParams({ page, size }),
      })
      .pipe(
        map(unwrapApiResponse),
        map((response) => normalizeOrganizationsPage(response, page, size)),
      );
  }

  getAll(): Observable<Organization[]> {
    if (this.apiMockMode) {
      return of(MOCK_ORGANIZATIONS);
    }

    return this.http
      .get<ApiResponse<Organization[]> | Organization[]>(`${this.baseUrl}/organizations`)
      .pipe(map(unwrapApiResponse));
  }

  getById(id: number): Observable<Organization> {
    if (this.apiMockMode) {
      const organization = MOCK_ORGANIZATIONS.find((item) => item.id === id);
      return of(organization ?? { id, name: 'Organizacion no encontrada' });
    }

    return this.http
      .get<ApiResponse<Organization> | Organization>(`${this.baseUrl}/organizations/${id}`)
      .pipe(map(unwrapApiResponse));
  }

  create(body: UpsertOrganizationRequest): Observable<Organization> {
    if (this.apiMockMode) {
      const created = { id: Date.now(), name: body.name };
      MOCK_ORGANIZATIONS.unshift(created);
      return of(created);
    }

    return this.http
      .post<ApiResponse<Organization> | Organization>(`${this.baseUrl}/organizations`, body)
      .pipe(map(unwrapApiResponse));
  }

  update(id: number, body: UpsertOrganizationRequest): Observable<Organization> {
    if (this.apiMockMode) {
      const index = MOCK_ORGANIZATIONS.findIndex((organization) => organization.id === id);
      const updated = { id, name: body.name };
      if (index >= 0) {
        MOCK_ORGANIZATIONS[index] = updated;
      }
      return of(updated);
    }

    return this.http
      .put<ApiResponse<Organization> | Organization>(`${this.baseUrl}/organizations/${id}`, body)
      .pipe(map(unwrapApiResponse));
  }

  remove(id: number): Observable<void> {
    if (this.apiMockMode) {
      const index = MOCK_ORGANIZATIONS.findIndex((organization) => organization.id === id);
      if (index >= 0) {
        MOCK_ORGANIZATIONS.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/organizations/${id}`);
  }
}
