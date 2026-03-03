import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Organization, PageResult } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

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

@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getPage(page: number, size: number): Observable<PageResult<Organization>> {
    if (API_MOCK_MODE) {
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

    return this.http.get<PageResult<Organization>>(`${this.baseUrl}/organizations`, {
      params: toHttpParams({ page, size }),
    });
  }

  getAll(): Observable<Organization[]> {
    if (API_MOCK_MODE) {
      return of(MOCK_ORGANIZATIONS);
    }

    return this.http.get<Organization[]>(`${this.baseUrl}/organizations`);
  }

  getById(id: number): Observable<Organization> {
    if (API_MOCK_MODE) {
      const organization = MOCK_ORGANIZATIONS.find((item) => item.id === id);
      return of(organization ?? { id, name: 'Organizacion no encontrada' });
    }

    return this.http.get<Organization>(`${this.baseUrl}/organizations/${id}`);
  }

  create(body: UpsertOrganizationRequest): Observable<Organization> {
    if (API_MOCK_MODE) {
      const created = { id: Date.now(), name: body.name };
      MOCK_ORGANIZATIONS.unshift(created);
      return of(created);
    }

    return this.http.post<Organization>(`${this.baseUrl}/organizations`, body);
  }

  update(id: number, body: UpsertOrganizationRequest): Observable<Organization> {
    if (API_MOCK_MODE) {
      const index = MOCK_ORGANIZATIONS.findIndex((organization) => organization.id === id);
      const updated = { id, name: body.name };
      if (index >= 0) {
        MOCK_ORGANIZATIONS[index] = updated;
      }
      return of(updated);
    }

    return this.http.put<Organization>(`${this.baseUrl}/organizations/${id}`, body);
  }

  remove(id: number): Observable<void> {
    if (API_MOCK_MODE) {
      const index = MOCK_ORGANIZATIONS.findIndex((organization) => organization.id === id);
      if (index >= 0) {
        MOCK_ORGANIZATIONS.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/organizations/${id}`);
  }
}
