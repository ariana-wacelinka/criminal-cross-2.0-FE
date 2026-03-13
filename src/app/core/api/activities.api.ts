import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay } from 'rxjs';
import { Activity, ActivityPageResponse, ApiResponse } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { API_MOCK_MODE } from '../http';
import { toHttpParams } from '../http/http-params.util';

const MOCK_ACTIVITIES: Activity[] = Array.from({ length: 140 }, (_, index) => {
  const hqId = 101 + (index % 56);
  const topic = [
    'Cross Training',
    'Yoga Flow',
    'Pilates Core',
    'Box Funcional',
    'HIIT Express',
    'Movilidad',
    'Funcional Pro',
  ][index % 7];
  return {
    id: index + 1,
    name: `${topic} ${Math.floor(index / 7) + 1}`,
    description: `Clase para ${topic.toLowerCase()} en sede ${hqId}.`,
    isActive: index % 9 !== 0,
    hqId,
  };
});

export interface UpsertActivityRequest {
  name: string;
  description: string;
  hqId: number;
}

export interface UpdateActivityRequest {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface GetActivitiesQuery {
  hqId: number;
  name?: string;
  page?: number;
  size?: number;
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

@Injectable({ providedIn: 'root' })
export class ActivitiesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiMockMode = inject(API_MOCK_MODE);
  private readonly getAllCache = new Map<string, Observable<ActivityPageResponse>>();

  private invalidateGetAllCache(): void {
    this.getAllCache.clear();
  }

  private cacheKey(query: GetActivitiesQuery): string {
    return [query.hqId, query.name ?? '', query.page ?? '', query.size ?? ''].join('|');
  }

  getAll(query: GetActivitiesQuery): Observable<ActivityPageResponse> {
    if (this.apiMockMode) {
      const page = Math.max(0, query.page ?? 0);
      const size = Math.max(1, query.size ?? 10);
      const byHeadquarters = MOCK_ACTIVITIES.filter((item) => item.hqId === query.hqId);
      const byName = query.name?.trim()
        ? byHeadquarters.filter((item) =>
            item.name.toLowerCase().includes(query.name!.trim().toLowerCase()),
          )
        : byHeadquarters;
      const start = page * size;
      const content = byName.slice(start, start + size);
      const totalElements = byName.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / size));

      return of({ content, page, size, totalElements, totalPages });
    }

    const key = this.cacheKey(query);
    const cached = this.getAllCache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ApiResponse<ActivityPageResponse> | ActivityPageResponse>(`${this.baseUrl}/activities`, {
        params: toHttpParams(query),
      })
      .pipe(map(unwrapApiResponse), shareReplay(1));
    this.getAllCache.set(key, request$);
    return request$;
  }

  getById(id: number): Observable<Activity> {
    if (this.apiMockMode) {
      const activity = MOCK_ACTIVITIES.find((item) => item.id === id);
      return of(
        activity ?? {
          id,
          hqId: 0,
          name: 'Actividad no encontrada',
          description: '',
          isActive: false,
        },
      );
    }

    return this.http
      .get<ApiResponse<Activity> | Activity>(`${this.baseUrl}/activities/${id}`)
      .pipe(map(unwrapApiResponse));
  }

  create(body: UpsertActivityRequest): Observable<Activity> {
    if (this.apiMockMode) {
      const created: Activity = {
        id: Date.now(),
        name: body.name,
        description: body.description,
        isActive: true,
        hqId: body.hqId,
      };
      MOCK_ACTIVITIES.unshift(created);
      return of(created);
    }

    return this.http
      .post<ApiResponse<Activity> | Activity>(`${this.baseUrl}/activities`, body)
      .pipe(
        map(unwrapApiResponse),
        map((activity) => {
          this.invalidateGetAllCache();
          return activity;
        }),
      );
  }

  update(id: number, body: UpdateActivityRequest): Observable<Activity> {
    if (this.apiMockMode) {
      const index = MOCK_ACTIVITIES.findIndex((item) => item.id === id);
      const previous = index >= 0 ? MOCK_ACTIVITIES[index] : undefined;
      const updated: Activity = {
        id,
        hqId: previous?.hqId ?? 0,
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      };

      if (index >= 0) {
        MOCK_ACTIVITIES[index] = updated;
      }

      return of(updated);
    }

    return this.http
      .put<ApiResponse<Activity> | Activity>(`${this.baseUrl}/activities/${id}`, body)
      .pipe(
        map(unwrapApiResponse),
        map((activity) => {
          this.invalidateGetAllCache();
          return activity;
        }),
      );
  }

  remove(id: number): Observable<void> {
    if (this.apiMockMode) {
      const index = MOCK_ACTIVITIES.findIndex((item) => item.id === id);
      if (index >= 0) {
        MOCK_ACTIVITIES.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/activities/${id}`).pipe(
      map((response) => {
        this.invalidateGetAllCache();
        return response;
      }),
    );
  }
}
