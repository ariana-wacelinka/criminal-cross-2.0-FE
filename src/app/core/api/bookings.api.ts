import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Booking, BookingPageResponse, BookingStatus } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { createIdempotencyKey } from '../http/idempotency-key.util';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

const MOCK_BOOKINGS: Booking[] = Array.from({ length: 180 }, (_, index) => ({
  id: index + 1,
  sessionId: (index % 120) + 1,
  userId: (index % 60) + 10,
  status: [
    BookingStatus.CONFIRMED,
    BookingStatus.WAITLISTED,
    BookingStatus.ATTENDED,
    BookingStatus.NO_SHOW,
  ][index % 4],
  createdAt: new Date(Date.UTC(2026, 2, 1 + (index % 20), 10, 0, 0)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 2, 1 + (index % 20), 10, 15, 0)).toISOString(),
}));

export interface BookingsQuery {
  sessionId?: number;
  userId?: number;
  page?: number;
  limit?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class BookingsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  create(
    sessionId: number,
    userId?: number,
    idempotencyKey = createIdempotencyKey(),
  ): Observable<Booking> {
    if (API_MOCK_MODE) {
      const created: Booking = {
        id: Date.now(),
        sessionId,
        userId: userId ?? 10,
        status: BookingStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_BOOKINGS.unshift(created);
      return of(created);
    }

    return this.http.post<Booking>(
      `${this.baseUrl}/sessions/${sessionId}/bookings`,
      userId ? { userId } : null,
      {
        headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
      },
    );
  }

  cancel(bookingId: number, idempotencyKey = createIdempotencyKey()): Observable<Booking> {
    if (API_MOCK_MODE) {
      const index = MOCK_BOOKINGS.findIndex((item) => item.id === bookingId);
      const previous = index >= 0 ? MOCK_BOOKINGS[index] : undefined;
      const cancelled: Booking = {
        id: bookingId,
        sessionId: previous?.sessionId ?? 0,
        userId: previous?.userId ?? 0,
        status: BookingStatus.CANCELLED,
        createdAt: previous?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cancelledAt: new Date().toISOString(),
      };
      if (index >= 0) {
        MOCK_BOOKINGS[index] = cancelled;
      }
      return of(cancelled);
    }

    return this.http.post<Booking>(`${this.baseUrl}/bookings/${bookingId}/cancel`, null, {
      headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
    });
  }

  getAll(query: BookingsQuery): Observable<BookingPageResponse> {
    if (API_MOCK_MODE) {
      const page = Math.max(0, query.page ?? 0);
      const limit = Math.max(1, query.limit ?? 10);
      const filtered = MOCK_BOOKINGS.filter((item) => {
        if (query.sessionId && item.sessionId !== query.sessionId) {
          return false;
        }
        if (query.userId && item.userId !== query.userId) {
          return false;
        }
        return true;
      });

      const start = page * limit;
      return of({
        items: filtered.slice(start, start + limit),
        page,
        limit,
        total: filtered.length,
      });
    }

    return this.http.get<BookingPageResponse>(`${this.baseUrl}/bookings`, {
      params: toHttpParams(query),
    });
  }
}
