import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SKIP_REFRESH } from '../http/request-context.tokens';
import { AuthSessionService } from './auth-session.service';

const isAuthEndpoint = (url: string): boolean =>
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/verify-token') ||
    url.includes('/auth/refresh');

export const authRefreshInterceptor: HttpInterceptorFn = (request, next) => {
    if (request.context.get(SKIP_REFRESH) || isAuthEndpoint(request.url)) {
        return next(request);
    }

    const authSession = inject(AuthSessionService);

    return next(request).pipe(
        catchError((error: unknown) => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
                return throwError(() => error);
            }

            return from(authSession.refreshAccessToken()).pipe(
                switchMap((newToken) => {
                    if (!newToken) {
                        return throwError(() => error);
                    }

                    return next(
                        request.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`,
                            },
                        }),
                    );
                }),
                catchError(() => throwError(() => error)),
            );
        }),
    );
};
