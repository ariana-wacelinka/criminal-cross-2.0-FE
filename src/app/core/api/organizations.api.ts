import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Organization } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';

const API_MOCK_MODE = true;

const MOCK_ORGANIZATIONS: Organization[] = [
  { id: 1, name: 'Athlium Norte' },
  { id: 2, name: 'Athlium Centro' },
  { id: 3, name: 'Athlium Sur' },
  { id: 4, name: 'Partner Recoleta' },
];

export interface UpsertOrganizationRequest {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(): Observable<Organization[]> {
    if (API_MOCK_MODE) {
      return of(MOCK_ORGANIZATIONS);
    }

    return this.http.get<Organization[]>(`${this.baseUrl}/organizations`);
  }

  create(body: UpsertOrganizationRequest): Observable<Organization> {
    if (API_MOCK_MODE) {
      return of({ id: Date.now(), name: body.name });
    }

    return this.http.post<Organization>(`${this.baseUrl}/organizations`, body);
  }

  update(id: number, body: UpsertOrganizationRequest): Observable<Organization> {
    if (API_MOCK_MODE) {
      return of({ id, name: body.name });
    }

    return this.http.put<Organization>(`${this.baseUrl}/organizations/${id}`, body);
  }

  remove(id: number): Observable<void> {
    if (API_MOCK_MODE) {
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/organizations/${id}`);
  }
}
