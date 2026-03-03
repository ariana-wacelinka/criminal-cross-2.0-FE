import { Injectable } from '@angular/core';
import { AuthenticatedUser } from '../domain/models';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
    private readonly accessTokenKey = 'athlium_access_token';
    private readonly refreshTokenKey = 'athlium_refresh_token';
    private readonly mockUserKey = 'athlium_mock_user';

    getAccessToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    setAccessToken(token: string): void {
        localStorage.setItem(this.accessTokenKey, token);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    setRefreshToken(token?: string): void {
        if (!token) {
            return;
        }

        localStorage.setItem(this.refreshTokenKey, token);
    }

    getMockUser(): AuthenticatedUser | null {
        const raw = localStorage.getItem(this.mockUserKey);

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as AuthenticatedUser;
        } catch {
            localStorage.removeItem(this.mockUserKey);
            return null;
        }
    }

    setMockUser(user: AuthenticatedUser): void {
        localStorage.setItem(this.mockUserKey, JSON.stringify(user));
    }

    clearMockUser(): void {
        localStorage.removeItem(this.mockUserKey);
    }

    clear(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.mockUserKey);
    }
}
