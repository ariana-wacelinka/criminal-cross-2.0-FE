import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  SessionInstance,
  SessionPageResponse,
  SessionSource,
  SessionStatus,
  WaitlistStrategy,
} from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

const MOCK_SESSIONS: SessionInstance[] = Array.from({ length: 120 }, (_, index) => {
  const headquartersId = 101 + (index % 6);
  const startsAt = new Date(Date.UTC(2026, 2, 10 + (index % 14), 8 + (index % 10), 0, 0));
  const endsAt = new Date(startsAt.getTime() + [45, 50, 60][index % 3] * 60000);
  return {
    id: index + 1,
    organizationId: 1,
    headquartersId,
    activityId: (index % 20) + 1,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: [SessionStatus.OPEN, SessionStatus.CLOSED, SessionStatus.CANCELLED][index % 3],
    source: index % 2 ? SessionSource.SCHEDULER : SessionSource.MANUAL,
    maxParticipants: 20,
    waitlistEnabled: true,
    waitlistMaxSize: 10,
    waitlistStrategy: WaitlistStrategy.FIFO,
    cancellationMinHoursBeforeStart: 4,
    cancellationAllowLateCancel: false,
  };
});

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

  getAll(query: GetSessionsQuery): Observable<SessionPageResponse> {
    if (API_MOCK_MODE) {
      const page = Math.max(0, query.page ?? 0);
      const limit = Math.max(1, query.limit ?? 10);
      const filtered = MOCK_SESSIONS.filter((item) => {
        if (query.organizationId && item.organizationId !== query.organizationId) {
          return false;
        }
        if (query.headquartersId && item.headquartersId !== query.headquartersId) {
          return false;
        }
        if (query.activityId && item.activityId !== query.activityId) {
          return false;
        }
        return true;
      });

      const [sortField, sortDirection] = (query.sort ?? '').split(':');
      const sorted = [...filtered];
      if (sortField === 'startsAt') {
        sorted.sort((left, right) => {
          const diff = new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
          return sortDirection === 'desc' ? -diff : diff;
        });
      }

      const start = page * limit;
      return of({
        items: sorted.slice(start, start + limit),
        page,
        limit,
        total: sorted.length,
      });
    }

    return this.http.get<SessionPageResponse>(`${this.baseUrl}/sessions`, {
      params: toHttpParams(query),
    });
  }

  getById(sessionId: number): Observable<SessionInstance> {
    if (API_MOCK_MODE) {
      const session = MOCK_SESSIONS.find((item) => item.id === sessionId);
      return of(
        session ?? {
          id: sessionId,
          organizationId: 1,
          headquartersId: 0,
          activityId: 0,
          startsAt: new Date().toISOString(),
          endsAt: new Date().toISOString(),
          status: SessionStatus.OPEN,
          source: SessionSource.MANUAL,
          maxParticipants: 0,
          waitlistEnabled: false,
          waitlistMaxSize: 0,
          waitlistStrategy: WaitlistStrategy.FIFO,
          cancellationMinHoursBeforeStart: 0,
          cancellationAllowLateCancel: false,
        },
      );
    }

    return this.http.get<SessionInstance>(`${this.baseUrl}/sessions/${sessionId}`);
  }
}
