import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Activity, ActivityPageResponse } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

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

@Injectable({ providedIn: 'root' })
export class ActivitiesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(query: GetActivitiesQuery): Observable<ActivityPageResponse> {
    if (API_MOCK_MODE) {
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

    return this.http.get<ActivityPageResponse>(`${this.baseUrl}/activities`, {
      params: toHttpParams(query),
    });
  }

  getById(id: number): Observable<Activity> {
    if (API_MOCK_MODE) {
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

    return this.http.get<Activity>(`${this.baseUrl}/activities/${id}`);
  }

  create(body: UpsertActivityRequest): Observable<Activity> {
    if (API_MOCK_MODE) {
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

    return this.http.post<Activity>(`${this.baseUrl}/activities`, body);
  }

  update(id: number, body: UpdateActivityRequest): Observable<Activity> {
    if (API_MOCK_MODE) {
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

    return this.http.put<Activity>(`${this.baseUrl}/activities/${id}`, body);
  }

  remove(id: number): Observable<void> {
    if (API_MOCK_MODE) {
      const index = MOCK_ACTIVITIES.findIndex((item) => item.id === id);
      if (index >= 0) {
        MOCK_ACTIVITIES.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/activities/${id}`);
  }
}
