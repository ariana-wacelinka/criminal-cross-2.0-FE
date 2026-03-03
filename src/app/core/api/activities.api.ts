import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activity, ActivityPageResponse } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

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
    return this.http.get<ActivityPageResponse>(`${this.baseUrl}/activities`, {
      params: toHttpParams(query),
    });
  }

  getById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.baseUrl}/activities/${id}`);
  }

  create(body: UpsertActivityRequest): Observable<Activity> {
    return this.http.post<Activity>(`${this.baseUrl}/activities`, body);
  }

  update(id: number, body: UpdateActivityRequest): Observable<Activity> {
    return this.http.put<Activity>(`${this.baseUrl}/activities/${id}`, body);
  }
}
