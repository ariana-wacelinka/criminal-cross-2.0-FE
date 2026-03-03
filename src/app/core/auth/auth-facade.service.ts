import { inject, Injectable } from '@angular/core';
import { Role } from '../domain/models';
import { FirebaseAuthClientService } from './firebase-auth-client.service';
import { AuthSessionService } from './auth-session.service';

const AUTH_MOCK_MODE = true;

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly firebaseAuth = inject(FirebaseAuthClientService);
  private readonly authSession = inject(AuthSessionService);

  async loginWithEmailPassword(
    email: string,
    password: string,
    role: Role = Role.ORG_ADMIN,
  ): Promise<void> {
    if (AUTH_MOCK_MODE) {
      this.authSession.startMockSession(email, undefined, role);
      return;
    }

    const idToken = await this.firebaseAuth.signInWithEmailPassword(email, password);
    await this.authSession.loginWithIdToken(idToken);
  }

  async registerWithEmailPassword(
    name: string,
    lastName: string,
    email: string,
    password: string,
    role: Role = Role.CLIENT,
  ): Promise<void> {
    if (AUTH_MOCK_MODE) {
      const displayName = [name, lastName].join(' ').trim() || undefined;
      this.authSession.startMockSession(email, displayName, role);
      return;
    }

    const idToken = await this.firebaseAuth.registerWithEmailPassword(
      name,
      lastName,
      email,
      password,
    );
    await this.authSession.registerWithIdToken(name, lastName, idToken);
    await this.authSession.loginWithIdToken(idToken);
  }

  async logout(): Promise<void> {
    if (AUTH_MOCK_MODE) {
      this.authSession.logoutLocal();
      return;
    }

    await this.authSession.logout();
    await this.firebaseAuth.signOutFirebase();
  }
}
