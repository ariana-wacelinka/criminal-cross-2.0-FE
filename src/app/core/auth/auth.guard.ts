import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthSessionService } from './auth-session.service';
import { Role } from '../domain/models';

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

export const roleGuard: CanActivateFn = (route): boolean | UrlTree => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  const user = authSession.user();
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = (route.data?.['roles'] as Role[] | undefined) ?? [];
  if (!allowedRoles.length) {
    return true;
  }

  const userRoles = user.roles ?? [];
  if (allowedRoles.some((role) => userRoles.includes(role))) {
    return true;
  }

  const primaryRole = userRoles[0];
  switch (primaryRole) {
    case Role.SUPERADMIN:
      return router.createUrlTree(['/dashboard']);
    case Role.ORG_OWNER:
      return router.createUrlTree(['/org-owner/dashboard']);
    case Role.ORG_ADMIN:
      return router.createUrlTree(['/hq-admin/dashboard']);
    case Role.PROFESSOR:
      return router.createUrlTree(['/professor/dashboard']);
    case Role.CLIENT:
      return router.createUrlTree(['/client/dashboard']);
    default:
      return router.createUrlTree(['/dashboard']);
  }
};
