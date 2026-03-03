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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
