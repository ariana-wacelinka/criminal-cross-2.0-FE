import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import {
  ApiResponse,
  SessionInstance,
  SessionPageResponse,
  SessionSource,
  SessionStatus,
  WaitlistStrategy,
} from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { API_MOCK_MODE } from '../http';
import { toHttpParams } from '../http/http-params.util';

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
    participants: [],
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

interface BackendActivityRef {
  id?: number;
  name?: string;
}

interface BackendSessionParticipant {
  id: number;
  name: string;
  lastName?: string;
  email?: string;
}

interface BackendSessionInstance {
  id: number;
  organizationId: number;
  headquartersId: number;
  activityId?: number;
  activityName?: string;
  activity?: BackendActivityRef | null;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  source: SessionSource;
  participants?: BackendSessionParticipant[];
  maxParticipants: number;
  waitlistEnabled: boolean;
  waitlistMaxSize: number;
  waitlistStrategy: WaitlistStrategy;
  cancellationMinHoursBeforeStart: number;
  cancellationAllowLateCancel: boolean;
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

function toBackendPage(page: number | undefined): number | undefined {
  if (page === undefined || page === null) {
    return undefined;
  }
  return Math.max(1, page + 1);
}

function normalizeSession(item: BackendSessionInstance | SessionInstance): SessionInstance {
  const backend = item as BackendSessionInstance;
  const activityId = backend.activityId ?? backend.activity?.id ?? 0;
  const activityName = backend.activityName ?? backend.activity?.name;

  return {
    ...item,
    activityId,
    activityName,
    participants: backend.participants ?? (item as SessionInstance).participants ?? [],
  };
}

function normalizeSessionsPage(response: SessionPageResponse): SessionPageResponse {
  return {
    ...response,
    items: (response.items ?? []).map((item) => normalizeSession(item as BackendSessionInstance)),
  };
}

@Injectable({ providedIn: 'root' })
export class SessionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiMockMode = inject(API_MOCK_MODE);

  getAll(query: GetSessionsQuery): Observable<SessionPageResponse> {
    if (this.apiMockMode) {
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

    return this.http
      .get<ApiResponse<SessionPageResponse> | SessionPageResponse>(`${this.baseUrl}/sessions`, {
        params: toHttpParams({ ...query, page: toBackendPage(query.page) }),
      })
      .pipe(map(unwrapApiResponse), map(normalizeSessionsPage));
  }

  getById(sessionId: number): Observable<SessionInstance> {
    if (this.apiMockMode) {
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
          participants: [],
          maxParticipants: 0,
          waitlistEnabled: false,
          waitlistMaxSize: 0,
          waitlistStrategy: WaitlistStrategy.FIFO,
          cancellationMinHoursBeforeStart: 0,
          cancellationAllowLateCancel: false,
        },
      );
    }

    return this.http
      .get<ApiResponse<SessionInstance> | SessionInstance>(`${this.baseUrl}/sessions/${sessionId}`)
      .pipe(
        map(unwrapApiResponse),
        map((session) => normalizeSession(session as BackendSessionInstance)),
      );
  }
}
