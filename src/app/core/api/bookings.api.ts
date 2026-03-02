import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking, PageResult } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { createIdempotencyKey } from '../http/idempotency-key.util';
import { toHttpParams } from '../http/http-params.util';

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

    create(sessionId: number, idempotencyKey = createIdempotencyKey()): Observable<Booking> {
        return this.http.post<Booking>(`${this.baseUrl}/sessions/${sessionId}/bookings`, null, {
            headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
        });
    }

    cancel(bookingId: number, idempotencyKey = createIdempotencyKey()): Observable<Booking> {
        return this.http.post<Booking>(`${this.baseUrl}/bookings/${bookingId}/cancel`, null, {
            headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
        });
    }

    getAll(query: BookingsQuery): Observable<PageResult<Booking>> {
        return this.http.get<PageResult<Booking>>(`${this.baseUrl}/bookings`, {
            params: toHttpParams(query),
        });
    }
}
