import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Headquarters } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

export interface UpsertHeadquartersRequest {
    organizationId: number;
    name: string;
}

@Injectable({ providedIn: 'root' })
export class HeadquartersApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    getAll(organizationId?: number): Observable<Headquarters[]> {
        return this.http.get<Headquarters[]>(`${this.baseUrl}/headquarters`, {
            params: toHttpParams({ organizationId }),
        });
    }

    getById(id: number): Observable<Headquarters> {
        return this.http.get<Headquarters>(`${this.baseUrl}/headquarters/${id}`);
    }

    create(body: UpsertHeadquartersRequest): Observable<Headquarters> {
        return this.http.post<Headquarters>(`${this.baseUrl}/headquarters`, body);
    }

    update(id: number, body: UpsertHeadquartersRequest): Observable<Headquarters> {
        return this.http.put<Headquarters>(`${this.baseUrl}/headquarters/${id}`, body);
    }
}
