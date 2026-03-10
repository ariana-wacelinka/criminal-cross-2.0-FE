import { Routes } from '@angular/router';
import { guestGuard, authGuard, roleGuard, clientContextGuard } from './core/auth';
import { Role } from './core/domain/models';

const SUPERADMIN_OR_CLIENT = [Role.SUPERADMIN];
const SUPERADMIN_ONLY = [Role.SUPERADMIN];
const ORG_OWNER_OR_ADMIN = [Role.ORG_OWNER, Role.ORG_ADMIN];
const HQ_ADMIN_ONLY = [Role.ORG_ADMIN];
const PROFESSOR_ONLY = [Role.PROFESSOR];
const HQ_STAFF = [Role.ORG_ADMIN, Role.PROFESSOR];
const USER_MANAGERS = [Role.ORG_OWNER, Role.ORG_ADMIN, Role.PROFESSOR];

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login').then((m) => m.LoginPage),
    canMatch: [guestGuard],
  },
  {
    path: 'me',
    loadComponent: () => import('./features/me').then((m) => m.MePage),
  },
  {
    path: '',
    loadComponent: () => import('./features/home').then((m) => m.HomePage),
    canMatch: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'entry-dashboard',
      },
      {
        path: 'entry-dashboard',
        loadComponent: () =>
          import('./features/dashboard-redirect/dashboard-redirect.page').then(
            (m) => m.DashboardRedirectPage,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/superadmin').then((m) => m.SuperadminPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_OR_CLIENT },
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationsPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'organizations/create',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationCreatePage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'organizations/:organizationId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationDetailPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'organizations/:organizationId/edit',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationEditPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'organizations/:organizationId/delete',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationDeletePage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'headquarters',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'headquarters/create',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersCreatePage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'headquarters/:headquartersId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersDetailPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'headquarters/:headquartersId/activities',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersActivitiesPage),
        canActivate: [roleGuard],
        data: { roles: HQ_STAFF },
      },
      {
        path: 'headquarters/:headquartersId/activities/create',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityCreatePage),
        canActivate: [roleGuard],
        data: { roles: HQ_STAFF },
      },
      {
        path: 'headquarters/:headquartersId/activities/:activityId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityDetailPage),
        canActivate: [roleGuard],
        data: { roles: HQ_STAFF },
      },
      {
        path: 'headquarters/:headquartersId/activities/:activityId/edit',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityEditPage),
        canActivate: [roleGuard],
        data: { roles: HQ_STAFF },
      },
      {
        path: 'headquarters/:headquartersId/activities/:activityId/delete',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityDeletePage),
        canActivate: [roleGuard],
        data: { roles: HQ_STAFF },
      },
      {
        path: 'headquarters/:headquartersId/edit',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersEditPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'users',
        loadComponent: () => import('./features/superadmin').then((m) => m.SuperadminUsersPage),
        canActivate: [roleGuard],
        data: { roles: SUPERADMIN_ONLY },
      },
      {
        path: 'users/:userId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminUserDetailPage),
        canActivate: [roleGuard],
        data: { roles: USER_MANAGERS },
      },
      {
        path: 'users/:userId/edit',
        loadComponent: () => import('./features/superadmin').then((m) => m.SuperadminUserEditPage),
        canActivate: [roleGuard],
        data: { roles: USER_MANAGERS },
      },
      {
        path: 'users/:userId/delete',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminUserDeletePage),
        canActivate: [roleGuard],
        data: { roles: [Role.SUPERADMIN, Role.ORG_ADMIN, Role.ORG_OWNER] },
      },
      {
        path: 'org-owner/dashboard',
        loadComponent: () => import('./features/org-owner').then((m) => m.OrgOwnerPage),
        canActivate: [roleGuard],
        data: { roles: ORG_OWNER_OR_ADMIN },
      },
      {
        path: 'org-owner/schedules',
        loadComponent: () => import('./features/operations-shared').then((m) => m.SchedulesOpsPage),
        canActivate: [roleGuard],
        data: { scope: 'org', roles: ORG_OWNER_OR_ADMIN },
      },
      {
        path: 'org-owner/agenda',
        loadComponent: () => import('./features/operations-shared').then((m) => m.AgendaOpsPage),
        canActivate: [roleGuard],
        data: { scope: 'org', roles: ORG_OWNER_OR_ADMIN },
      },
      {
        path: 'org-owner/headquarters',
        loadComponent: () => import('./features/org-owner').then((m) => m.OrgOwnerHeadquartersPage),
        canActivate: [roleGuard],
        data: { roles: ORG_OWNER_OR_ADMIN },
      },
      {
        path: 'org-owner/users',
        loadComponent: () => import('./features/org-owner').then((m) => m.OrgOwnerUsersPage),
        canActivate: [roleGuard],
        data: { roles: ORG_OWNER_OR_ADMIN },
      },
      {
        path: 'org-admin/dashboard',
        redirectTo: 'org-owner/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'org-admin/schedules',
        redirectTo: 'org-owner/schedules',
        pathMatch: 'full',
      },
      {
        path: 'org-admin/agenda',
        redirectTo: 'org-owner/agenda',
        pathMatch: 'full',
      },
      {
        path: 'org-admin/headquarters',
        redirectTo: 'org-owner/headquarters',
        pathMatch: 'full',
      },
      {
        path: 'org-admin/users',
        redirectTo: 'org-owner/users',
        pathMatch: 'full',
      },
      {
        path: 'hq-admin/dashboard',
        loadComponent: () => import('./features/hq-admin').then((m) => m.HqAdminPage),
        canActivate: [roleGuard],
        data: { roles: HQ_ADMIN_ONLY },
      },
      {
        path: 'hq-admin/schedules',
        loadComponent: () => import('./features/operations-shared').then((m) => m.SchedulesOpsPage),
        canActivate: [roleGuard],
        data: { scope: 'hq', roles: HQ_ADMIN_ONLY },
      },
      {
        path: 'hq-admin/agenda',
        loadComponent: () => import('./features/operations-shared').then((m) => m.AgendaOpsPage),
        canActivate: [roleGuard],
        data: { scope: 'hq', roles: HQ_ADMIN_ONLY },
      },
      {
        path: 'hq-admin/users',
        loadComponent: () => import('./features/hq-admin').then((m) => m.HqAdminUsersPage),
        canActivate: [roleGuard],
        data: { roles: HQ_ADMIN_ONLY },
      },
      {
        path: 'hq-admin/payments',
        loadComponent: () => import('./features/hq-admin').then((m) => m.HqAdminPaymentsPage),
        canActivate: [roleGuard],
        data: { roles: HQ_ADMIN_ONLY },
      },
      {
        path: 'professor/dashboard',
        loadComponent: () => import('./features/professor').then((m) => m.ProfessorPage),
        canActivate: [roleGuard],
        data: { roles: PROFESSOR_ONLY },
      },
      {
        path: 'professor/users',
        loadComponent: () => import('./features/professor').then((m) => m.ProfessorUsersPage),
        canActivate: [roleGuard],
        data: { roles: PROFESSOR_ONLY },
      },
      {
        path: 'professor/schedules',
        loadComponent: () => import('./features/operations-shared').then((m) => m.SchedulesOpsPage),
        canActivate: [roleGuard],
        data: { scope: 'hq', roles: PROFESSOR_ONLY },
      },
      {
        path: 'professor/agenda',
        loadComponent: () => import('./features/operations-shared').then((m) => m.AgendaOpsPage),
        canActivate: [roleGuard],
        data: { scope: 'hq', roles: PROFESSOR_ONLY },
      },
      {
        path: 'client/pre-onboarding',
        loadComponent: () => import('./features/client').then((m) => m.ClientPreOnboardingPage),
        canActivate: [roleGuard],
        data: { roles: [Role.CLIENT] },
      },
      {
        path: 'client/dashboard',
        loadComponent: () => import('./features/client').then((m) => m.ClientClassesPage),
        canActivate: [roleGuard, clientContextGuard],
        data: { roles: [Role.CLIENT] },
      },
      {
        path: 'client/overview',
        loadComponent: () => import('./features/client').then((m) => m.ClientPage),
        canActivate: [roleGuard, clientContextGuard],
        data: { roles: [Role.CLIENT] },
      },
      {
        path: 'client/classes',
        loadComponent: () => import('./features/client').then((m) => m.ClientClassesPage),
        canActivate: [roleGuard, clientContextGuard],
        data: { roles: [Role.CLIENT] },
      },
      {
        path: 'client/history',
        loadComponent: () => import('./features/client').then((m) => m.ClientHistoryPage),
        canActivate: [roleGuard, clientContextGuard],
        data: { roles: [Role.CLIENT] },
      },
      {
        path: 'client/packages',
        loadComponent: () => import('./features/client').then((m) => m.ClientPackagesPage),
        canActivate: [roleGuard, clientContextGuard],
        data: { roles: [Role.CLIENT] },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
