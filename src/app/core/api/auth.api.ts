import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { SKIP_AUTH, SKIP_REFRESH } from '../http/request-context.tokens';

export interface LoginRequest {
    idToken: string;
}

export interface RegisterRequest {
    name: string;
    lastName: string;
    idToken: string;
}

export interface AuthSessionResponse {
    accessToken: string;
    refreshToken?: string;
    user: AuthenticatedUser;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);
    private readonly publicEndpointContext = new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true);

    login(body: LoginRequest): Observable<AuthSessionResponse> {
        return this.http.post<AuthSessionResponse>(`${this.baseUrl}/auth/login`, body, {
            context: this.publicEndpointContext,
        });
    }

    verifyToken(body: LoginRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/auth/verify-token`, body, {
            context: this.publicEndpointContext,
        });
    }

    register(body: RegisterRequest): Observable<AuthenticatedUser> {
        return this.http.post<AuthenticatedUser>(`${this.baseUrl}/auth/register`, body, {
            context: this.publicEndpointContext,
        });
    }

    me(): Observable<AuthenticatedUser> {
        return this.http.get<AuthenticatedUser>(`${this.baseUrl}/auth/me`);
    }

    refresh(refreshToken?: string): Observable<AuthSessionResponse> {
        return this.http.post<AuthSessionResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken }, {
            context: this.publicEndpointContext,
        });
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/auth/logout`, {});
    }
}
