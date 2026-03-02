import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionConfiguration } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

export interface EffectiveConfigQuery {
    organizationId?: number;
    headquartersId?: number;
    activityId?: number;
    sessionId?: number;
}

@Injectable({ providedIn: 'root' })
export class GymConfigApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    updateOrganization(orgId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
        return this.http.put<SessionConfiguration>(`${this.baseUrl}/gym/config/organizations/${orgId}`, body);
    }

    updateHeadquarters(hqId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
        return this.http.put<SessionConfiguration>(`${this.baseUrl}/gym/config/headquarters/${hqId}`, body);
    }

    updateActivity(activityId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
        return this.http.put<SessionConfiguration>(`${this.baseUrl}/gym/config/activities/${activityId}`, body);
    }

    updateSession(sessionId: number, body: SessionConfiguration): Observable<SessionConfiguration> {
        return this.http.put<SessionConfiguration>(`${this.baseUrl}/gym/config/sessions/${sessionId}`, body);
    }

    getEffective(query: EffectiveConfigQuery): Observable<SessionConfiguration> {
        return this.http.get<SessionConfiguration>(`${this.baseUrl}/gym/config/effective`, {
            params: toHttpParams(query),
        });
    }
}
