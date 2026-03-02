import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Organization } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';

export interface UpsertOrganizationRequest {
    name: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    getAll(): Observable<Organization[]> {
        return this.http.get<Organization[]>(`${this.baseUrl}/organizations`);
    }

    create(body: UpsertOrganizationRequest): Observable<Organization> {
        return this.http.post<Organization>(`${this.baseUrl}/organizations`, body);
    }

    update(id: number, body: UpsertOrganizationRequest): Observable<Organization> {
        return this.http.put<Organization>(`${this.baseUrl}/organizations/${id}`, body);
    }

    remove(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/organizations/${id}`);
    }
}
