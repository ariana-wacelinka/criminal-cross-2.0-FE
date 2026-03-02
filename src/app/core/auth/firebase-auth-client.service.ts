import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { FIREBASE_CLIENT_CONFIG, FirebaseClientConfig } from './firebase-client-config.token';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthClientService {
    private readonly config = inject(FIREBASE_CLIENT_CONFIG);

    private app: FirebaseApp | null = null;
    private auth: Auth | null = null;

    async signInWithEmailPassword(email: string, password: string): Promise<string> {
        const auth = this.getAuthClient();
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        return credentials.user.getIdToken();
    }

    async registerWithEmailPassword(name: string, lastName: string, email: string, password: string): Promise<string> {
        const auth = this.getAuthClient();
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = `${name} ${lastName}`.trim();

        if (displayName) {
            await updateProfile(credentials.user, { displayName });
        }

        return credentials.user.getIdToken();
    }

    async signOutFirebase(): Promise<void> {
        const auth = this.getAuthClient();
        await signOut(auth);
    }

    private getAuthClient(): Auth {
        if (this.auth) {
            return this.auth;
        }

        this.ensureConfig(this.config);

        if (!this.app) {
            this.app = getApps().length ? getApp() : initializeApp(this.config as FirebaseOptions);
        }

        this.auth = getAuth(this.app);
        return this.auth;
    }

    private ensureConfig(config: FirebaseClientConfig): void {
        const missingFields: Array<keyof FirebaseClientConfig> = [];

        if (!config.apiKey) {
            missingFields.push('apiKey');
        }

        if (!config.authDomain) {
            missingFields.push('authDomain');
        }

        if (!config.projectId) {
            missingFields.push('projectId');
        }

        if (!config.appId) {
            missingFields.push('appId');
        }

        if (missingFields.length > 0) {
            throw new Error(`Firebase config incompleta. Faltan: ${missingFields.join(', ')}`);
        }
    }
}
