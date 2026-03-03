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
    },
    {
        path: '**',
        redirectTo: '',
    },
];
