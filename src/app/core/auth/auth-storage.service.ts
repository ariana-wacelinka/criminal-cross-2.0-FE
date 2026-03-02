import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
    private readonly accessTokenKey = 'athlium_access_token';
    private readonly refreshTokenKey = 'athlium_refresh_token';

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

    clear(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
    }
}
