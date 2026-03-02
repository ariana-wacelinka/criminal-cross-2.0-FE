import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi, AuthSessionResponse } from '../api/auth.api';
import { AuthenticatedUser } from '../domain/models';
import { AuthStorageService } from './auth-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
    private readonly authApi = inject(AuthApi);
    private readonly authStorage = inject(AuthStorageService);

    private readonly userState = signal<AuthenticatedUser | null>(null);
    private readonly bootstrappedState = signal(false);
    private refreshInFlight: Promise<string | null> | null = null;

    readonly user = computed(() => this.userState());
    readonly isAuthenticated = computed(() => !!this.userState());
    readonly isBootstrapped = computed(() => this.bootstrappedState());

    async bootstrap(): Promise<void> {
        const token = this.authStorage.getAccessToken();

        if (!token) {
            this.bootstrappedState.set(true);
            return;
        }

        try {
            const user = await firstValueFrom(this.authApi.me());
            this.userState.set(user);
        } catch {
            await this.refreshAccessToken();
        } finally {
            this.bootstrappedState.set(true);
        }
    }

    async loginWithIdToken(idToken: string): Promise<void> {
        const session = await firstValueFrom(this.authApi.login({ idToken }));
        this.applySession(session);
    }

    async registerWithIdToken(name: string, lastName: string, idToken: string): Promise<void> {
        await firstValueFrom(this.authApi.verifyToken({ idToken }));
        const user = await firstValueFrom(this.authApi.register({ name, lastName, idToken }));
        this.userState.set(user);
    }

    async refreshAccessToken(): Promise<string | null> {
        if (this.refreshInFlight) {
            return this.refreshInFlight;
        }

        const refreshToken = this.authStorage.getRefreshToken();

        if (!refreshToken) {
            this.clearSession();
            return null;
        }

        this.refreshInFlight = firstValueFrom(this.authApi.refresh(refreshToken))
            .then((session) => {
                this.applySession(session);
                return session.accessToken;
            })
            .catch(() => {
                this.clearSession();
                return null;
            })
            .finally(() => {
                this.refreshInFlight = null;
            });

        return this.refreshInFlight;
    }

    async logout(): Promise<void> {
        try {
            await firstValueFrom(this.authApi.logout());
        } finally {
            this.clearSession();
        }
    }

    private applySession(session: AuthSessionResponse): void {
        this.authStorage.setAccessToken(session.accessToken);
        this.authStorage.setRefreshToken(session.refreshToken);
        this.userState.set(session.user);
    }

    private clearSession(): void {
        this.authStorage.clear();
        this.userState.set(null);
    }
}
