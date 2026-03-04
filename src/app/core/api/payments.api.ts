import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Payment, PaymentMethod } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';

const API_MOCK_MODE = true;

const MOCK_PAYMENTS: Payment[] = Array.from({ length: 18 }, (_, index) => ({
  id: index + 1,
  amount: String(15000 + index * 900),
  paymentMethod: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.TRANSFER][index % 3],
  paidAt: new Date(Date.UTC(2026, 2, 1 + index)).toISOString().slice(0, 10),
}));

export interface CreatePaymentRequest {
  amount: string;
  paymentMethod: PaymentMethod | string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(): Observable<Payment[]> {
    if (API_MOCK_MODE) {
      return of(MOCK_PAYMENTS);
    }

    return this.http.get<Payment[]>(`${this.baseUrl}/payments`);
  }

  create(body: CreatePaymentRequest): Observable<Payment> {
    if (API_MOCK_MODE) {
      const created: Payment = {
        id: Date.now(),
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        paidAt: new Date().toISOString().slice(0, 10),
      };
      MOCK_PAYMENTS.unshift(created);
      return of(created);
    }

    return this.http.post<Payment>(`${this.baseUrl}/payments`, body);
  }
}
