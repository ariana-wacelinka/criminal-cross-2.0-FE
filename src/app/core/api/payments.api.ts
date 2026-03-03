import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Payment, PaymentMethod } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';

export interface CreatePaymentRequest {
  amount: string;
  paymentMethod: PaymentMethod | string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  create(body: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/payments`, body);
  }
}
