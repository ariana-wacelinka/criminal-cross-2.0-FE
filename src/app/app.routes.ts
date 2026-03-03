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
        path: 'headquarters',
        loadComponent: () =>
          import('./features/superadmin').then((m) => m.SuperadminHeadquartersPage),
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
