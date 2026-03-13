import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthSessionService, authRefreshInterceptor, authTokenInterceptor } from './core/auth';
import { runtimeEnv } from './core/config/runtime-env';
import { API_BASE_URL, API_MOCK_MODE } from './core/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor, authRefreshInterceptor])),
    {
      provide: API_BASE_URL,
      useValue: runtimeEnv.API_BASE_URL,
    },
    {
      provide: API_MOCK_MODE,
      useValue: runtimeEnv.API_MOCK_MODE,
    },
    provideAppInitializer(() => {
      const authSession = inject(AuthSessionService);
      return authSession.bootstrap();
    }),
  ],
};
