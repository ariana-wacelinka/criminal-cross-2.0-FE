import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResult, SessionInstance } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

export interface GetSessionsQuery {
    organizationId?: number;
    headquartersId?: number;
    activityId?: number;
    page?: number;
    limit?: number;
    sort?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionsApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    getAll(query: GetSessionsQuery): Observable<PageResult<SessionInstance>> {
        return this.http.get<PageResult<SessionInstance>>(`${this.baseUrl}/sessions`, {
            params: toHttpParams(query),
        });
    }

    getById(sessionId: number): Observable<SessionInstance> {
        return this.http.get<SessionInstance>(`${this.baseUrl}/sessions/${sessionId}`);
    }
}
