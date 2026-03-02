import { inject, Injectable } from '@angular/core';
import { FirebaseAuthClientService } from './firebase-auth-client.service';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
    private readonly firebaseAuth = inject(FirebaseAuthClientService);
    private readonly authSession = inject(AuthSessionService);

    async loginWithEmailPassword(email: string, password: string): Promise<void> {
        const idToken = await this.firebaseAuth.signInWithEmailPassword(email, password);
        await this.authSession.loginWithIdToken(idToken);
    }

    async registerWithEmailPassword(name: string, lastName: string, email: string, password: string): Promise<void> {
        const idToken = await this.firebaseAuth.registerWithEmailPassword(name, lastName, email, password);
        await this.authSession.registerWithIdToken(name, lastName, idToken);
        await this.authSession.loginWithIdToken(idToken);
    }

    async logout(): Promise<void> {
        await this.authSession.logout();
        await this.firebaseAuth.signOutFirebase();
    }
}
