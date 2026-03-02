import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  AuthSessionService,
  authRefreshInterceptor,
  authTokenInterceptor,
  FIREBASE_CLIENT_CONFIG,
  firebaseClientConfig,
} from './core/auth';
import { API_BASE_URL } from './core/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor, authRefreshInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: '/api',
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
