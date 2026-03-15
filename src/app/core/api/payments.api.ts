import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay, tap } from 'rxjs';
import { ApiResponse, PageResult, Payment, PaymentMethod } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { API_MOCK_MODE } from '../http';
import { toHttpParams } from '../http/http-params.util';

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
  clientId: number;
  userName: string;
  userLastName: string;
  organizationId: number;
  headquartersId: number;
  activities?: Array<{ id: number; name: string }>;
}

const MOCK_PAYMENT_LIST: PaymentListItem[] = Array.from({ length: 26 }, (_, index) => {
  const id = index + 1;
  const clientId = 10 + (index % 9);
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
    clientId,
    userName,
    userLastName,
    organizationId: 1,
    headquartersId: 101 + (index % 2),
  };
});

export interface CreatePaymentRequest {
  amount: string;
  paymentMethod: PaymentMethod | string;
  clientId?: number;
  headquartersId?: number;
  organizationId?: number;
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

function normalizePaymentsPage(
  response: PageResult<PaymentListItem> | { content?: PaymentListItem[]; totalElements?: number },
  page: number,
  size: number,
): PageResult<PaymentListItem> {
  const safePage = Math.max(0, page);
  const safeSize = Math.max(1, size);

  if (Array.isArray((response as { items?: PaymentListItem[] }).items)) {
    const typed = response as PageResult<PaymentListItem>;
    const rawPage = Number.isFinite(typed.page) ? Number(typed.page) : safePage;
    return {
      items: typed.items ?? [],
      total: Number.isFinite(typed.total) ? Number(typed.total) : 0,
      page: rawPage > 0 ? rawPage - 1 : rawPage,
      size: Number.isFinite(typed.size) ? Number(typed.size) : safeSize,
    };
  }

  const backend = response as {
    content?: PaymentListItem[];
    page?: number;
    size?: number;
    totalElements?: number;
  };
  const rawPage = Number.isFinite(backend.page) ? Number(backend.page) : safePage + 1;
  return {
    items: backend.content ?? [],
    total: Number.isFinite(backend.totalElements) ? Number(backend.totalElements) : 0,
    page: rawPage > 0 ? rawPage - 1 : 0,
    size: Number.isFinite(backend.size) ? Number(backend.size) : safeSize,
  };
}

function toBackendPage(page: number): number {
  return Math.max(1, page + 1);
}

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly apiMockMode = inject(API_MOCK_MODE);
  private readonly byHqCache = new Map<string, Observable<PageResult<PaymentListItem>>>();
  private readonly byOrgCache = new Map<string, Observable<PageResult<PaymentListItem>>>();
  private readonly pageCache = new Map<string, Observable<PageResult<Payment>>>();
  private allCache: Observable<Payment[]> | null = null;

  private invalidateCaches(): void {
    this.byHqCache.clear();
    this.byOrgCache.clear();
    this.pageCache.clear();
    this.allCache = null;
  }

  getAllByHq(
    headquartersId: number,
    page: number,
    size: number,
  ): Observable<PageResult<PaymentListItem>> {
    if (this.apiMockMode) {
      return of(
        slicePaymentsPage(
          MOCK_PAYMENT_LIST.filter((item) => item.headquartersId === headquartersId),
          page,
          size,
        ),
      );
    }

    const key = `${headquartersId}|${page}|${size}`;
    const cached = this.byHqCache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<
        | ApiResponse<
            PageResult<PaymentListItem> | { content: PaymentListItem[]; totalElements: number }
          >
        | PageResult<PaymentListItem>
        | { content: PaymentListItem[]; totalElements: number }
      >(`${this.baseUrl}/payments`, {
        params: toHttpParams({ headquartersId, page: toBackendPage(page), size }),
      })
      .pipe(
        map(unwrapApiResponse),
        map((payload) => normalizePaymentsPage(payload, page, size)),
        shareReplay(1),
      );
    this.byHqCache.set(key, request$);
    return request$;
  }

  getAllByOrg(
    organizationId: number,
    page: number,
    size: number,
  ): Observable<PageResult<PaymentListItem>> {
    if (this.apiMockMode) {
      return of(
        slicePaymentsPage(
          MOCK_PAYMENT_LIST.filter((item) => item.organizationId === organizationId),
          page,
          size,
        ),
      );
    }

    const key = `${organizationId}|${page}|${size}`;
    const cached = this.byOrgCache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<
        | ApiResponse<
            PageResult<PaymentListItem> | { content: PaymentListItem[]; totalElements: number }
          >
        | PageResult<PaymentListItem>
        | { content: PaymentListItem[]; totalElements: number }
      >(`${this.baseUrl}/payments`, {
        params: toHttpParams({ organizationId, page: toBackendPage(page), size }),
      })
      .pipe(
        map(unwrapApiResponse),
        map((payload) => normalizePaymentsPage(payload, page, size)),
        shareReplay(1),
      );
    this.byOrgCache.set(key, request$);
    return request$;
  }

  getPage(page: number, size: number): Observable<PageResult<Payment>> {
    if (this.apiMockMode) {
      return of(slicePage(MOCK_PAYMENTS, page, size));
    }

    const key = `${page}|${size}`;
    const cached = this.pageCache.get(key);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<ApiResponse<PageResult<Payment>> | PageResult<Payment>>(`${this.baseUrl}/payments`, {
        params: toHttpParams({ page, size }),
      })
      .pipe(map(unwrapApiResponse), shareReplay(1));
    this.pageCache.set(key, request$);
    return request$;
  }

  getAll(): Observable<Payment[]> {
    if (this.apiMockMode) {
      return of(MOCK_PAYMENTS);
    }

    if (this.allCache) {
      return this.allCache;
    }

    const request$ = this.http
      .get<ApiResponse<Payment[]> | Payment[]>(`${this.baseUrl}/payments`)
      .pipe(map(unwrapApiResponse), shareReplay(1));
    this.allCache = request$;
    return request$;
  }

  create(body: CreatePaymentRequest): Observable<Payment> {
    if (this.apiMockMode) {
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
        clientId: body.clientId ?? 0,
        userName: 'Usuario',
        userLastName: 'Sin asignar',
        organizationId: body.organizationId ?? 1,
        headquartersId: body.headquartersId ?? 101,
      });
      return of(created);
    }

    return this.http.post<ApiResponse<Payment> | Payment>(`${this.baseUrl}/payments`, body).pipe(
      map(unwrapApiResponse),
      tap(() => this.invalidateCaches()),
    );
  }
}
