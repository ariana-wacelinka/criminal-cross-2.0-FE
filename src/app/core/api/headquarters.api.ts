import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Headquarters, PageResult } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

const MOCK_HEADQUARTERS: Headquarters[] = Array.from({ length: 56 }, (_, index) => {
  const id = 100 + index + 1;
  const organizationId = (index % 24) + 1;
  const zone = ['Norte', 'Centro', 'Sur', 'Oeste'][index % 4];
  const neighborhood = [
    'Palermo',
    'Belgrano',
    'Caballito',
    'Recoleta',
    'Lanus',
    'Banfield',
    'Once',
    'Devoto',
    'Quilmes',
    'Pilar',
  ][index % 10];
  return { id, organizationId, name: `${zone} ${neighborhood} ${Math.floor(index / 10) + 1}` };
});

export interface UpsertHeadquartersRequest {
  organizationId: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class HeadquartersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getPage(
    page: number,
    size: number,
    organizationId?: number,
  ): Observable<PageResult<Headquarters>> {
    if (API_MOCK_MODE) {
      const safePage = Math.max(0, page);
      const safeSize = Math.max(1, size);
      const source = organizationId
        ? MOCK_HEADQUARTERS.filter((hq) => hq.organizationId === organizationId)
        : MOCK_HEADQUARTERS;
      const start = safePage * safeSize;
      const items = source.slice(start, start + safeSize);
      return of({
        items,
        total: source.length,
        page: safePage,
        size: safeSize,
      });
    }

    return this.http.get<PageResult<Headquarters>>(`${this.baseUrl}/headquarters`, {
      params: toHttpParams({ page, size, organizationId }),
    });
  }

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
      const created = { id: Date.now(), organizationId: body.organizationId, name: body.name };
      MOCK_HEADQUARTERS.unshift(created);
      return of(created);
    }

    return this.http.post<Headquarters>(`${this.baseUrl}/headquarters`, body);
  }

  update(id: number, body: UpsertHeadquartersRequest): Observable<Headquarters> {
    if (API_MOCK_MODE) {
      const updated = { id, organizationId: body.organizationId, name: body.name };
      const index = MOCK_HEADQUARTERS.findIndex((headquarters) => headquarters.id === id);
      if (index >= 0) {
        MOCK_HEADQUARTERS[index] = updated;
      }
      return of(updated);
    }

    return this.http.put<Headquarters>(`${this.baseUrl}/headquarters/${id}`, body);
  }

  remove(id: number): Observable<void> {
    if (API_MOCK_MODE) {
      const index = MOCK_HEADQUARTERS.findIndex((headquarters) => headquarters.id === id);
      if (index >= 0) {
        MOCK_HEADQUARTERS.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/headquarters/${id}`);
  }
}
