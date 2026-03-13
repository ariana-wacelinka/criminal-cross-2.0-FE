import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SKIP_AUTH } from '../http/request-context.tokens';
import { AuthStorageService } from './auth-storage.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
    if (request.context.get(SKIP_AUTH)) {
        return next(request);
    }

    const authStorage = inject(AuthStorageService);
    const token = authStorage.getAccessToken();

    if (!token) {
        return next(request);
    }

    return next(
        request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        }),
    );
};
