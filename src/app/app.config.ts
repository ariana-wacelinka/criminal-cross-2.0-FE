import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  AuthSessionService,
  authRefreshInterceptor,
  authTokenInterceptor,
  FIREBASE_CLIENT_CONFIG,
  firebaseClientConfig,
} from './core/auth';
import { API_BASE_URL, API_MOCK_MODE } from './core/http';

import { routes } from './app.routes';

type RuntimeEnv = {
  API_BASE_URL?: string;
  API_MOCK_MODE?: string | boolean;
};

const runtimeEnv = (globalThis as { __env?: RuntimeEnv }).__env ?? {};
const runtimeApiBaseUrl = runtimeEnv.API_BASE_URL ?? '/api';
const runtimeApiMockMode = runtimeEnv.API_MOCK_MODE === true || runtimeEnv.API_MOCK_MODE === 'true';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor, authRefreshInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: runtimeApiBaseUrl,
    },
    {
      provide: API_MOCK_MODE,
      useValue: runtimeApiMockMode,
    },
    {
      provide: FIREBASE_CLIENT_CONFIG,
      useValue: firebaseClientConfig,
    },
    provideAppInitializer(() => {
      const authSession = inject(AuthSessionService);
      return authSession.bootstrap();
    }),
  ],
};
