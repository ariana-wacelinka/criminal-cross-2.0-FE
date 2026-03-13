import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { AuthFacadeService, AuthSessionService } from '../../core/auth';
import { ClientContextService } from '../../core/client-context/client-context.service';
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
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly clientContext = inject(ClientContextService);

  protected readonly authSession = inject(AuthSessionService);
  protected readonly currentRole = computed(() => {
    const sessionRole = this.authSession.user()?.roles[0];
    if (sessionRole) {
      return sessionRole;
    }
    return this.roleFromUrl(this.router.url) ?? Role.ORG_ADMIN;
  });
  protected readonly currentRoleLabel = computed(
    () => this.roleLabel(this.currentRole()) || 'Sin rol',
  );
  protected readonly isClientRole = computed(() => this.currentRole() === Role.CLIENT);
  protected readonly showRoleBadge = computed(() => !this.isClientRole());

  private readonly accessibleHeadquarters = toSignal(this.headquartersApi.getAll(), {
    initialValue: [],
  });

  private readonly currentOrganizationId = computed(() => {
    if (this.isClientRole()) {
      return this.clientContext.current()?.organizationId ?? null;
    }

    return this.accessibleHeadquarters()[0]?.organizationId ?? null;
  });

  private readonly currentOrganization = toSignal(
    toObservable(this.currentOrganizationId).pipe(
      switchMap((organizationId) => {
        if (!organizationId) {
          return of(null);
        }
        return this.organizationsApi.getById(organizationId).pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  protected readonly shellTitle = computed(() => {
    if (this.currentRole() === Role.SUPERADMIN) {
      return 'ATHLIUM Staff';
    }

    return this.currentOrganization()?.name ?? 'Mi organización';
  });

  protected readonly headerTitle = computed(() => {
    if (this.currentRole() === Role.SUPERADMIN) {
      return 'ATHLIUM Inicio';
    }

    return this.currentOrganization()?.name ?? 'Mi organización';
  });
  private readonly defaultHeadquartersId = computed(
    () => this.accessibleHeadquarters()[0]?.id ?? null,
  );
  private readonly activitiesPath = computed(() => {
    const headquartersId = this.defaultHeadquartersId();
    return headquartersId ? `/headquarters/${headquartersId}/activities` : '/dashboard';
  });

  protected readonly roleNavItems = computed<ShellNavItem[]>(() => {
    switch (this.currentRole()) {
      case Role.CLIENT:
        return [
          { label: 'Inicio', path: '/client/dashboard' },
          { label: 'Entrenamientos', path: '/client/history' },
          { label: 'Mis paquetes', path: '/client/packages' },
        ];
      case Role.PROFESSOR:
        return [
          { label: 'Inicio', path: '/professor/dashboard' },
          { label: 'Usuarios', path: '/professor/users' },
          { label: 'Actividades', path: this.activitiesPath() },
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
          { label: 'Actividades', path: this.activitiesPath() },
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
        return role || 'Sin rol';
    }
  }

  private roleFromUrl(url: string): Role | null {
    if (url.startsWith('/org-owner')) {
      return Role.ORG_OWNER;
    }
    if (url.startsWith('/hq-admin')) {
      return Role.ORG_ADMIN;
    }
    if (url.startsWith('/professor')) {
      return Role.PROFESSOR;
    }
    if (url.startsWith('/client')) {
      return Role.CLIENT;
    }
    return null;
  }
}
