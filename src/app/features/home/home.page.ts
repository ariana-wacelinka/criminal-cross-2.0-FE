import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  protected readonly currentRoleLabel = computed(() => this.roleLabel(this.currentRole()));

  protected readonly roleNavItems = computed<ShellNavItem[]>(() => {
    switch (this.currentRole()) {
      case Role.CLIENT:
        return [
          { label: 'Inicio', path: '/client/dashboard' },
          { label: 'Reservas', path: '/client/classes' },
          { label: 'Entrenamientos', path: '/client/history' },
          { label: 'Mis paquetes', path: '/client/packages' },
        ];
      case Role.PROFESSOR:
        return [
          { label: 'Inicio', path: '/professor/dashboard' },
          { label: 'Usuarios', path: '/professor/users' },
          { label: 'Actividades', path: '/headquarters/101/activities' },
          { label: 'Horarios', path: '/professor/schedules' },
          { label: 'Agenda', path: '/professor/agenda' },
        ];
      case Role.SUPERADMIN:
        return [
          { label: 'Inicio', path: '/dashboard' },
          { label: 'Organizaciones', path: '/organizations' },
          { label: 'Sedes', path: '/headquarters' },
          { label: 'Usuarios', path: '/users' },
        ];
      case Role.ORG_OWNER:
        return [
          { label: 'Inicio', path: '/org-owner/dashboard' },
          { label: 'Sedes', path: '/org-owner/headquarters' },
          { label: 'Usuarios', path: '/org-owner/users' },
          { label: 'Horarios por sede', path: '/org-owner/schedules' },
          { label: 'Agenda por sede', path: '/org-owner/agenda' },
        ];
      case Role.ORG_ADMIN:
        return [
          { label: 'Inicio', path: '/hq-admin/dashboard' },
          { label: 'Usuarios', path: '/hq-admin/users' },
          { label: 'Pagos', path: '/hq-admin/payments' },
          { label: 'Actividades', path: '/headquarters/101/activities' },
          { label: 'Horarios', path: '/hq-admin/schedules' },
          { label: 'Agenda', path: '/hq-admin/agenda' },
        ];
      default:
        return [
          { label: 'Inicio', path: '/dashboard' },
          { label: 'Actividades', path: '/dashboard' },
          { label: 'Horarios', path: '/dashboard' },
        ];
    }
  });

  protected readonly isMobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected async navigateTo(path: string): Promise<void> {
    this.closeMobileMenu();
    await this.router.navigateByUrl(path);
  }

  protected async goToMe(): Promise<void> {
    this.closeMobileMenu();
    await this.router.navigateByUrl('/me');
  }

  protected async logout(): Promise<void> {
    this.closeMobileMenu();
    await this.authFacade.logout();
    await this.router.navigateByUrl('/login');
  }

  private roleLabel(role: Role): string {
    switch (role) {
      case Role.SUPERADMIN:
        return 'Superadmin';
      case Role.ORG_OWNER:
        return 'Dueño de organización';
      case Role.ORG_ADMIN:
        return 'Admin sede';
      case Role.PROFESSOR:
        return 'Profesor';
      case Role.CLIENT:
        return 'Cliente';
      default:
        return role;
    }
  }
}
