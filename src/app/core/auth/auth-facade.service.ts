import { inject, Injectable } from '@angular/core';
import { Role } from '../domain/models';
import { API_MOCK_MODE } from '../http';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly authSession = inject(AuthSessionService);
  private readonly apiMockMode = inject(API_MOCK_MODE);

  async loginWithEmailPassword(
    email: string,
    password: string,
    role: Role = Role.ORG_ADMIN,
  ): Promise<void> {
    if (this.apiMockMode) {
      this.authSession.startMockSession(email, undefined, role);
      return;
    }

    await this.authSession.loginWithCredentials(email, password);
  }

  async registerWithEmailPassword(
    name: string,
    lastName: string,
    email: string,
    password: string,
    role: Role = Role.CLIENT,
  ): Promise<void> {
    if (this.apiMockMode) {
      const displayName = [name, lastName].join(' ').trim() || undefined;
      this.authSession.startMockSession(email, displayName, role);
      return;
    }

    await this.authSession.registerWithCredentials(name, lastName, email, password);
  }

  async logout(): Promise<void> {
    if (this.apiMockMode) {
      this.authSession.logoutLocal();
      return;
    }

    await this.authSession.logout();
  }
}
