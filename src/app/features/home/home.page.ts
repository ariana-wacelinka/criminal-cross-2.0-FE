import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacadeService, AuthSessionService } from '../../core/auth';
import { Role } from '../../core/domain/models';

interface ShellNavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './home.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacadeService);

  protected readonly authSession = inject(AuthSessionService);
  protected readonly currentRole = computed(
    () => this.authSession.user()?.roles[0] ?? Role.ORG_ADMIN,
  );

  protected readonly roleNavItems = computed<ShellNavItem[]>(() => {
    switch (this.currentRole()) {
      case Role.CLIENT:
        return [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Mis clases', path: '/dashboard' },
          { label: 'Mis paquetes', path: '/dashboard' },
        ];
      case Role.PROFESSOR:
        return [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Mis sesiones', path: '/dashboard' },
          { label: 'Asistencia', path: '/dashboard' },
        ];
      case Role.SUPERADMIN:
        return [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Organizaciones', path: '/organizations' },
          { label: 'Sedes', path: '/headquarters' },
          { label: 'Usuarios', path: '/users' },
        ];
      default:
        return [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Actividades', path: '/dashboard' },
          { label: 'Horarios', path: '/dashboard' },
        ];
    }
  });

  protected readonly mobileTabs = ['Dashboard', 'Perfil', 'Logout'];

  protected async goToHome(): Promise<void> {
    await this.router.navigateByUrl('/dashboard');
  }

  protected async goToMe(): Promise<void> {
    await this.router.navigateByUrl('/me');
  }

  protected async logout(): Promise<void> {
    await this.authFacade.logout();
    await this.router.navigateByUrl('/login');
  }

  protected async onMobileTab(tab: string): Promise<void> {
    if (tab === 'Dashboard') {
      await this.goToHome();
      return;
    }

    if (tab === 'Perfil') {
      await this.goToMe();
      return;
    }

    await this.logout();
  }
}
