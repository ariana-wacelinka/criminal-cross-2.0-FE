import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ApiResponse, ClientPackage } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { API_MOCK_MODE } from '../http';

const MOCK_CLIENT_PACKAGES: ClientPackage[] = [
  {
    id: 1,
    userId: 10,
    paymentId: 1,
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    active: true,
    credits: [{ activityId: 101, tokens: 10 }],
  },
  {
    id: 2,
    userId: 10,
    paymentId: 2,
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    active: false,
    credits: [{ activityId: 101, tokens: 0 }],
  },
  {
    id: 3,
    userId: 11,
    paymentId: 3,
    periodStart: '2026-03-01',
    periodEnd: '2026-03-31',
    active: true,
    credits: [{ activityId: 102, tokens: 8 }],
  },
  {
    id: 4,
    userId: 12,
    paymentId: 4,
    periodStart: '2026-03-03',
    periodEnd: '2026-04-02',
    active: true,
    credits: [
      { activityId: 101, tokens: 6 },
      { activityId: 104, tokens: 4 },
    ],
  },
  {
    id: 5,
    userId: 12,
    paymentId: 5,
    periodStart: '2026-02-01',
    periodEnd: '2026-03-02',
    active: false,
    credits: [
      { activityId: 101, tokens: 0 },
      { activityId: 103, tokens: 2 },
    ],
  },
  {
    id: 6,
    userId: 13,
    paymentId: 6,
    periodStart: '2026-01-10',
    periodEnd: '2026-02-09',
    active: false,
    credits: [{ activityId: 102, tokens: 0 }],
  },
  {
    id: 7,
    userId: 13,
    paymentId: 7,
    periodStart: '2026-02-10',
    periodEnd: '2026-03-11',
    active: true,
    credits: [
      { activityId: 102, tokens: 9 },
      { activityId: 105, tokens: 5 },
    ],
  },
];

export interface UpsertClientPackageRequest {
  paymentId: number;
  activityTokens: Record<string, number>;
}

function toCredits(activityTokens: Record<string, number>) {
  return Object.entries(activityTokens)
    .map(([activityId, tokens]) => ({ activityId: Number(activityId), tokens }))
    .filter((item) => Number.isFinite(item.activityId));
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

@Injectable({ providedIn: 'root' })
export class ClientPackagesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiMockMode = inject(API_MOCK_MODE);

  create(userId: number, body: UpsertClientPackageRequest): Observable<ClientPackage> {
    if (this.apiMockMode) {
      for (const item of MOCK_CLIENT_PACKAGES) {
        if (item.userId === userId) {
          item.active = false;
        }
      }

      const created: ClientPackage = {
        id: Date.now(),
        userId,
        paymentId: body.paymentId,
        periodStart: new Date().toISOString().slice(0, 10),
        periodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
        active: true,
        credits: toCredits(body.activityTokens),
      };
      MOCK_CLIENT_PACKAGES.unshift(created);
      return of(created);
    }

    return this.http
      .post<
        ApiResponse<ClientPackage> | ClientPackage
      >(`${this.baseUrl}/clients/${userId}/packages`, body)
      .pipe(map(unwrapApiResponse));
  }

  update(
    userId: number,
    clientPackageId: number,
    body: Partial<UpsertClientPackageRequest>,
  ): Observable<ClientPackage> {
    if (this.apiMockMode) {
      const index = MOCK_CLIENT_PACKAGES.findIndex(
        (item) => item.id === clientPackageId && item.userId === userId,
      );
      const previous = index >= 0 ? MOCK_CLIENT_PACKAGES[index] : MOCK_CLIENT_PACKAGES[0];
      const updated: ClientPackage = {
        ...previous,
        id: clientPackageId,
        userId,
        paymentId: body.paymentId ?? previous.paymentId,
        credits: body.activityTokens ? toCredits(body.activityTokens) : previous.credits,
      };
      if (index >= 0) {
        MOCK_CLIENT_PACKAGES[index] = updated;
      }
      return of(updated);
    }

    return this.http
      .patch<
        ApiResponse<ClientPackage> | ClientPackage
      >(`${this.baseUrl}/clients/${userId}/packages/${clientPackageId}`, body)
      .pipe(map(unwrapApiResponse));
  }

  getActive(userId: number): Observable<ClientPackage[]> {
    if (this.apiMockMode) {
      return of(MOCK_CLIENT_PACKAGES.filter((item) => item.userId === userId && item.active));
    }

    return this.http
      .get<
        ApiResponse<ClientPackage[]> | ClientPackage[]
      >(`${this.baseUrl}/clients/${userId}/packages/active`)
      .pipe(map(unwrapApiResponse));
  }

  getAll(userId: number): Observable<ClientPackage[]> {
    if (this.apiMockMode) {
      return of(MOCK_CLIENT_PACKAGES.filter((item) => item.userId === userId));
    }

    return this.http
      .get<
        ApiResponse<ClientPackage[]> | ClientPackage[]
      >(`${this.baseUrl}/clients/${userId}/packages`)
      .pipe(map(unwrapApiResponse));
  }
}
