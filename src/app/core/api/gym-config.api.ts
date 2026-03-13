import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, SessionConfiguration } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

export interface EffectiveConfigQuery {
  organizationId?: number;
  headquartersId?: number;
  activityId?: number;
  sessionId?: number;
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

@Injectable({ providedIn: 'root' })
export class GymConfigApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  updateOrganization(orgId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
    return this.http
      .put<
        ApiResponse<SessionConfiguration> | SessionConfiguration
      >(`${this.baseUrl}/gym/config/organizations/${orgId}`, body)
      .pipe(map(unwrapApiResponse));
  }

  updateHeadquarters(hqId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
    return this.http
      .put<
        ApiResponse<SessionConfiguration> | SessionConfiguration
      >(`${this.baseUrl}/gym/config/headquarters/${hqId}`, body)
      .pipe(map(unwrapApiResponse));
  }

  updateActivity(activityId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
    return this.http
      .put<
        ApiResponse<SessionConfiguration> | SessionConfiguration
      >(`${this.baseUrl}/gym/config/activities/${activityId}`, body)
      .pipe(map(unwrapApiResponse));
  }

  updateSession(sessionId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
    return this.http
      .put<
        ApiResponse<SessionConfiguration> | SessionConfiguration
      >(`${this.baseUrl}/gym/config/sessions/${sessionId}`, body)
      .pipe(map(unwrapApiResponse));
  }

  getEffective(query: EffectiveConfigQuery): Observable<SessionConfiguration> {
    return this.http
      .get<ApiResponse<SessionConfiguration> | SessionConfiguration>(
        `${this.baseUrl}/gym/config/effective`,
        {
          params: toHttpParams(query),
        },
      )
      .pipe(map(unwrapApiResponse));
  }
}
