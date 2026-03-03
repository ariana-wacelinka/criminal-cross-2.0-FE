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
        path: 'headquarters/:headquartersId/edit',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersEditPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/superadmin').then((m) => m.SuperadminUsersPage),
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminUserCreatePage),
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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
