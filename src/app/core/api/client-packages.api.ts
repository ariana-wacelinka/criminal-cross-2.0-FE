import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClientPackage, ClientPackageCredit } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';

export interface UpsertClientPackageRequest {
    paymentId: number;
    periodStart: string;
    periodEnd: string;
    active: boolean;
    credits: ClientPackageCredit[];
}

@Injectable({ providedIn: 'root' })
export class ClientPackagesApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    create(userId: number, body: UpsertClientPackageRequest): Observable<ClientPackage> {
        return this.http.post<ClientPackage>(`${this.baseUrl}/clients/${userId}/packages`, body);
    }

    update(userId: number, clientPackageId: number, body: Partial<UpsertClientPackageRequest>): Observable<ClientPackage> {
        return this.http.patch<ClientPackage>(`${this.baseUrl}/clients/${userId}/packages/${clientPackageId}`, body);
    }

    getActive(userId: number): Observable<ClientPackage[]> {
        return this.http.get<ClientPackage[]>(`${this.baseUrl}/clients/${userId}/packages/active`);
    }

    getAll(userId: number): Observable<ClientPackage[]> {
        return this.http.get<ClientPackage[]>(`${this.baseUrl}/clients/${userId}/packages`);
    }
}
