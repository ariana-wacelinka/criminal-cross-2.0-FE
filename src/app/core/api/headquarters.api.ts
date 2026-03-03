import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Headquarters } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

const MOCK_HEADQUARTERS: Headquarters[] = [
  { id: 101, organizationId: 1, name: 'Norte Palermo' },
  { id: 102, organizationId: 1, name: 'Norte Belgrano' },
  { id: 201, organizationId: 2, name: 'Centro Tribunales' },
  { id: 202, organizationId: 2, name: 'Centro Once' },
  { id: 203, organizationId: 2, name: 'Centro Congreso' },
  { id: 301, organizationId: 3, name: 'Sur Lanus' },
  { id: 401, organizationId: 4, name: 'Recoleta Central' },
];

export interface UpsertHeadquartersRequest {
  organizationId: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class HeadquartersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(organizationId?: number): Observable<Headquarters[]> {
    if (API_MOCK_MODE) {
      const filtered = organizationId
        ? MOCK_HEADQUARTERS.filter((hq) => hq.organizationId === organizationId)
        : MOCK_HEADQUARTERS;
      return of(filtered);
    }

    return this.http.get<Headquarters[]>(`${this.baseUrl}/headquarters`, {
      params: toHttpParams({ organizationId }),
    });
  }

  getById(id: number): Observable<Headquarters> {
    if (API_MOCK_MODE) {
      const headquarters = MOCK_HEADQUARTERS.find((hq) => hq.id === id);
      return of(headquarters ?? { id, organizationId: 0, name: 'Sede no encontrada' });
    }

    return this.http.get<Headquarters>(`${this.baseUrl}/headquarters/${id}`);
  }

  create(body: UpsertHeadquartersRequest): Observable<Headquarters> {
    if (API_MOCK_MODE) {
      return of({ id: Date.now(), organizationId: body.organizationId, name: body.name });
    }

    return this.http.post<Headquarters>(`${this.baseUrl}/headquarters`, body);
  }

  update(id: number, body: UpsertHeadquartersRequest): Observable<Headquarters> {
    if (API_MOCK_MODE) {
      return of({ id, organizationId: body.organizationId, name: body.name });
    }

    return this.http.put<Headquarters>(`${this.baseUrl}/headquarters/${id}`, body);
  }

  remove(id: number): Observable<void> {
    if (API_MOCK_MODE) {
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/headquarters/${id}`);
  }
}
