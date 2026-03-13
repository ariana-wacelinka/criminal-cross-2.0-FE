import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay, tap } from 'rxjs';
import { ApiResponse, Headquarters, PageResult } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { API_MOCK_MODE } from '../http';
import { toHttpParams } from '../http/http-params.util';

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

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

function normalizeHeadquartersPage(
  response: PageResult<Headquarters> | Headquarters[],
  page: number,
  size: number,
  organizationId?: number,
): PageResult<Headquarters> {
  const safePage = Math.max(0, page);
  const safeSize = Math.max(1, size);

  if (Array.isArray(response)) {
    const source = organizationId
      ? response.filter((headquarters) => headquarters.organizationId === organizationId)
      : response;
    const start = safePage * safeSize;
    return {
      items: source.slice(start, start + safeSize),
      total: source.length,
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
export class HeadquartersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiMockMode = inject(API_MOCK_MODE);
  private readonly pageCache = new Map<string, Observable<PageResult<Headquarters>>>();
  private readonly allCache = new Map<string, Observable<Headquarters[]>>();
  private readonly byIdCache = new Map<number, Observable<Headquarters>>();

  private invalidateCaches(): void {
    this.pageCache.clear();
    this.allCache.clear();
    this.byIdCache.clear();
  }

  getPage(
    page: number,
    size: number,
    organizationId?: number,
  ): Observable<PageResult<Headquarters>> {
    if (this.apiMockMode) {
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

    const key = `${page}|${size}|${organizationId ?? ''}`;
    const cached = this.pageCache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<
        | ApiResponse<PageResult<Headquarters> | Headquarters[]>
        | PageResult<Headquarters>
        | Headquarters[]
      >(`${this.baseUrl}/headquarters`, {
        params: toHttpParams({ page, size, organizationId }),
      })
      .pipe(
        map(unwrapApiResponse),
        map((response) => normalizeHeadquartersPage(response, page, size, organizationId)),
        shareReplay(1),
      );
    this.pageCache.set(key, request$);
    return request$;
  }

  getAll(organizationId?: number): Observable<Headquarters[]> {
    if (this.apiMockMode) {
      const filtered = organizationId
        ? MOCK_HEADQUARTERS.filter((hq) => hq.organizationId === organizationId)
        : MOCK_HEADQUARTERS;
      return of(filtered);
    }

    const key = `${organizationId ?? ''}`;
    const cached = this.allCache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ApiResponse<Headquarters[]> | Headquarters[]>(`${this.baseUrl}/headquarters`, {
        params: toHttpParams({ organizationId }),
      })
      .pipe(map(unwrapApiResponse), shareReplay(1));
    this.allCache.set(key, request$);
    return request$;
  }

  getById(id: number): Observable<Headquarters> {
    if (this.apiMockMode) {
      const headquarters = MOCK_HEADQUARTERS.find((hq) => hq.id === id);
      return of(headquarters ?? { id, organizationId: 0, name: 'Sede no encontrada' });
    }

    const cached = this.byIdCache.get(id);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ApiResponse<Headquarters> | Headquarters>(`${this.baseUrl}/headquarters/${id}`)
      .pipe(map(unwrapApiResponse), shareReplay(1));
    this.byIdCache.set(id, request$);
    return request$;
  }

  create(body: UpsertHeadquartersRequest): Observable<Headquarters> {
    if (this.apiMockMode) {
      const created = { id: Date.now(), organizationId: body.organizationId, name: body.name };
      MOCK_HEADQUARTERS.unshift(created);
      return of(created);
    }

    return this.http
      .post<ApiResponse<Headquarters> | Headquarters>(`${this.baseUrl}/headquarters`, body)
      .pipe(
        map(unwrapApiResponse),
        tap(() => this.invalidateCaches()),
      );
  }

  update(id: number, body: UpsertHeadquartersRequest): Observable<Headquarters> {
    if (this.apiMockMode) {
      const updated = { id, organizationId: body.organizationId, name: body.name };
      const index = MOCK_HEADQUARTERS.findIndex((headquarters) => headquarters.id === id);
      if (index >= 0) {
        MOCK_HEADQUARTERS[index] = updated;
      }
      return of(updated);
    }

    return this.http
      .put<ApiResponse<Headquarters> | Headquarters>(`${this.baseUrl}/headquarters/${id}`, body)
      .pipe(
        map(unwrapApiResponse),
        tap(() => this.invalidateCaches()),
      );
  }

  remove(id: number): Observable<void> {
    if (this.apiMockMode) {
      const index = MOCK_HEADQUARTERS.findIndex((headquarters) => headquarters.id === id);
      if (index >= 0) {
        MOCK_HEADQUARTERS.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http
      .delete<void>(`${this.baseUrl}/headquarters/${id}`)
      .pipe(tap(() => this.invalidateCaches()));
  }
}
