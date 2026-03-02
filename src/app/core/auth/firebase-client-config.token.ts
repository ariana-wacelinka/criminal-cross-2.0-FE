import { InjectionToken } from '@angular/core';

export interface FirebaseClientConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
}

export const FIREBASE_CLIENT_CONFIG = new InjectionToken<FirebaseClientConfig>('FIREBASE_CLIENT_CONFIG');
