import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthSessionService } from './auth-session.service';

export const authGuard: CanMatchFn = (): boolean | UrlTree => {
    const authSession = inject(AuthSessionService);
    const router = inject(Router);

    return authSession.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanMatchFn = (): boolean | UrlTree => {
    const authSession = inject(AuthSessionService);
    const router = inject(Router);

    return authSession.isAuthenticated() ? router.createUrlTree(['/']) : true;
};
