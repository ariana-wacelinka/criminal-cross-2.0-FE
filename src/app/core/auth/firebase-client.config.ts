import { FirebaseClientConfig } from './firebase-client-config.token';

declare global {
    interface Window {
        __ATHLIUM_FIREBASE__?: Partial<FirebaseClientConfig>;
    }
}

export const firebaseClientConfig: FirebaseClientConfig = {
    apiKey: window.__ATHLIUM_FIREBASE__?.apiKey ?? '',
    authDomain: window.__ATHLIUM_FIREBASE__?.authDomain ?? '',
    projectId: window.__ATHLIUM_FIREBASE__?.projectId ?? '',
    appId: window.__ATHLIUM_FIREBASE__?.appId ?? '',
};
