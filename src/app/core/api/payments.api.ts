import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ApiResponse, PageResult, Payment, PaymentMethod } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

const MOCK_PAYMENTS: Payment[] = Array.from({ length: 18 }, (_, index) => ({
  id: index + 1,
  amount: String(15000 + index * 900),
  paymentMethod: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.TRANSFER][index % 3],
  paidAt: new Date(Date.UTC(2026, 2, 1 + index)).toISOString().slice(0, 10),
}));

export interface PaymentListItem {
  id: number;
  amount: string;
  paymentMethod: PaymentMethod | string;
  paidAt: string;
  userId: number;
  userName: string;
  userLastName: string;
  organizationId: number;
  headquartersId: number;
}

const MOCK_PAYMENT_LIST: PaymentListItem[] = Array.from({ length: 26 }, (_, index) => {
  const id = index + 1;
  const userId = 10 + (index % 9);
  const userName = [
    'Ariana',
    'Juan',
    'Sofia',
    'Bruno',
    'Camila',
    'Marcos',
    'Lucia',
    'Franco',
    'Valentina',
  ][index % 9];
  const userLastName = [
    'Wacelinka',
    'Perez',
    'Lopez',
    'Mendez',
    'Fernandez',
    'Suarez',
    'Gomez',
    'Rossi',
    'Diaz',
  ][index % 9];
  return {
    id,
    amount: String(16000 + index * 1100),
    paymentMethod: [
      PaymentMethod.CASH,
      PaymentMethod.CARD,
      PaymentMethod.TRANSFER,
      PaymentMethod.OTHER,
    ][index % 4],
    paidAt: new Date(Date.UTC(2026, 2, 1 + index)).toISOString().slice(0, 10),
    userId,
    userName,
    userLastName,
    organizationId: 1,
    headquartersId: 101 + (index % 2),
  };
});

export interface CreatePaymentRequest {
  amount: string;
  paymentMethod: PaymentMethod | string;
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

function slicePage(items: Payment[], page: number, size: number): PageResult<Payment> {
  const safePage = Math.max(0, page);
  const safeSize = Math.max(1, size);
  const start = safePage * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    size: safeSize,
  };
}

function slicePaymentsPage(
  items: PaymentListItem[],
  page: number,
  size: number,
): PageResult<PaymentListItem> {
  const safePage = Math.max(0, page);
  const safeSize = Math.max(1, size);
  const start = safePage * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    size: safeSize,
  };
}

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAllByHq(
    headquartersId: number,
    page: number,
    size: number,
  ): Observable<PageResult<PaymentListItem>> {
    if (API_MOCK_MODE) {
      return of(
        slicePaymentsPage(
          MOCK_PAYMENT_LIST.filter((item) => item.headquartersId === headquartersId),
          page,
          size,
        ),
      );
    }

    return this.http
      .get<ApiResponse<PageResult<PaymentListItem>> | PageResult<PaymentListItem>>(
        `${this.baseUrl}/payments/by-headquarters/${headquartersId}`,
        {
          params: toHttpParams({ page, size }),
        },
      )
      .pipe(map(unwrapApiResponse));
  }

  getAllByOrg(
    organizationId: number,
    page: number,
    size: number,
  ): Observable<PageResult<PaymentListItem>> {
    if (API_MOCK_MODE) {
      return of(
        slicePaymentsPage(
          MOCK_PAYMENT_LIST.filter((item) => item.organizationId === organizationId),
          page,
          size,
        ),
      );
    }

    return this.http
      .get<ApiResponse<PageResult<PaymentListItem>> | PageResult<PaymentListItem>>(
        `${this.baseUrl}/payments/by-organization/${organizationId}`,
        {
          params: toHttpParams({ page, size }),
        },
      )
      .pipe(map(unwrapApiResponse));
  }

  getPage(page: number, size: number): Observable<PageResult<Payment>> {
    if (API_MOCK_MODE) {
      return of(slicePage(MOCK_PAYMENTS, page, size));
    }

    return this.http
      .get<ApiResponse<PageResult<Payment>> | PageResult<Payment>>(`${this.baseUrl}/payments`, {
        params: toHttpParams({ page, size }),
      })
      .pipe(map(unwrapApiResponse));
  }

  getAll(): Observable<Payment[]> {
    if (API_MOCK_MODE) {
      return of(MOCK_PAYMENTS);
    }

    return this.http
      .get<ApiResponse<Payment[]> | Payment[]>(`${this.baseUrl}/payments`)
      .pipe(map(unwrapApiResponse));
  }

  create(body: CreatePaymentRequest): Observable<Payment> {
    if (API_MOCK_MODE) {
      const createdId = Date.now();
      const created: Payment = {
        id: createdId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        paidAt: new Date().toISOString().slice(0, 10),
      };
      MOCK_PAYMENTS.unshift(created);
      MOCK_PAYMENT_LIST.unshift({
        id: createdId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        paidAt: created.paidAt,
        userId: 0,
        userName: 'Usuario',
        userLastName: 'Sin asignar',
        organizationId: 1,
        headquartersId: 101,
      });
      return of(created);
    }

    return this.http
      .post<ApiResponse<Payment> | Payment>(`${this.baseUrl}/payments`, body)
      .pipe(map(unwrapApiResponse));
  }
}
