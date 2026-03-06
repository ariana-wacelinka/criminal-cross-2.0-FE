import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login').then((m) => m.LoginPage),
  },
  {
    path: 'me',
    loadComponent: () => import('./features/me').then((m) => m.MePage),
  },
  {
    path: '',
    loadComponent: () => import('./features/home').then((m) => m.HomePage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/superadmin').then((m) => m.SuperadminPage),
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationsPage),
      },
      {
        path: 'organizations/create',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationCreatePage),
      },
      {
        path: 'organizations/:organizationId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationDetailPage),
      },
      {
        path: 'organizations/:organizationId/edit',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationEditPage),
      },
      {
        path: 'organizations/:organizationId/delete',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminOrganizationDeletePage),
      },
      {
        path: 'headquarters',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersPage),
      },
      {
        path: 'headquarters/create',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersCreatePage),
      },
      {
        path: 'headquarters/:headquartersId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersDetailPage),
      },
      {
        path: 'headquarters/:headquartersId/activities',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersActivitiesPage),
      },
      {
        path: 'headquarters/:headquartersId/activities/create',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityCreatePage),
      },
      {
        path: 'headquarters/:headquartersId/activities/:activityId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityDetailPage),
      },
      {
        path: 'headquarters/:headquartersId/activities/:activityId/edit',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityEditPage),
      },
      {
        path: 'headquarters/:headquartersId/activities/:activityId/delete',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminActivityDeletePage),
      },
      {
        path: 'headquarters/:headquartersId/edit',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersEditPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/superadmin').then((m) => m.SuperadminUsersPage),
      },
      {
        path: 'users/:userId',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminUserDetailPage),
      },
      {
        path: 'users/:userId/edit',
        loadComponent: () => import('./features/superadmin').then((m) => m.SuperadminUserEditPage),
      },
      {
        path: 'users/:userId/delete',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminUserDeletePage),
      },
      {
        path: 'org-owner/dashboard',
        loadComponent: () => import('./features/org-owner').then((m) => m.OrgOwnerPage),
      },
      {
        path: 'org-owner/schedules',
        loadComponent: () => import('./features/operations-shared').then((m) => m.SchedulesOpsPage),
        data: { scope: 'org' },
      },
      {
        path: 'org-owner/agenda',
        loadComponent: () => import('./features/operations-shared').then((m) => m.AgendaOpsPage),
        data: { scope: 'org' },
      },
      {
        path: 'org-owner/headquarters',
        loadComponent: () => import('./features/org-owner').then((m) => m.OrgOwnerHeadquartersPage),
      },
      {
        path: 'org-owner/users',
        loadComponent: () => import('./features/org-owner').then((m) => m.OrgOwnerUsersPage),
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
      },
      {
        path: 'hq-admin/schedules',
        loadComponent: () => import('./features/operations-shared').then((m) => m.SchedulesOpsPage),
        data: { scope: 'hq' },
      },
      {
        path: 'hq-admin/agenda',
        loadComponent: () => import('./features/operations-shared').then((m) => m.AgendaOpsPage),
        data: { scope: 'hq' },
      },
      {
        path: 'hq-admin/users',
        loadComponent: () => import('./features/hq-admin').then((m) => m.HqAdminUsersPage),
      },
      {
        path: 'hq-admin/payments',
        loadComponent: () => import('./features/hq-admin').then((m) => m.HqAdminPaymentsPage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
