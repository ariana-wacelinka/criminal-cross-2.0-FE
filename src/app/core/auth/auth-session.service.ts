import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi, AuthSessionResponse } from '../api/auth.api';
import { AuthenticatedUser, AuthProvider, Role } from '../domain/models';
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
    const mockUser = this.authStorage.getMockUser();

    if (mockUser) {
      this.userState.set(mockUser);
      this.bootstrappedState.set(true);
      return;
    }

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

  startMockSession(email: string, name?: string, role: Role = Role.ORG_ADMIN): void {
    const displayName = name?.trim() || this.createDisplayName(email);
    const mockUser: AuthenticatedUser = {
      firebaseUid: `mock-${email}`,
      email,
      name: displayName,
      emailVerified: true,
      provider: AuthProvider.EMAIL,
      userId: 1,
      roles: [role],
      active: true,
    };

    this.authStorage.setAccessToken('mock-access-token');
    this.authStorage.setRefreshToken('mock-refresh-token');
    this.authStorage.setMockUser(mockUser);
    this.userState.set(mockUser);
    this.bootstrappedState.set(true);
  }

  logoutLocal(): void {
    this.clearSession();
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

  private createDisplayName(email: string): string {
    const localPart = email.split('@')[0] ?? 'Usuario';
    const normalized = localPart.replace(/[._-]+/g, ' ').trim();
    if (!normalized) {
      return 'Usuario Demo';
    }

    return normalized
      .split(' ')
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }
}
