import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacadeService, AuthSessionService } from '../../core/auth';
import { Role } from '../../core/domain/models';

@Component({
  selector: 'app-home-page',
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

  protected readonly roleTitle = computed(() => {
    switch (this.currentRole()) {
      case Role.CLIENT:
        return 'Experiencia Cliente';
      case Role.PROFESSOR:
        return 'Panel Profesor';
      case Role.SUPERADMIN:
        return 'Superadmin Control';
      default:
        return 'Activities Management';
    }
  });

  protected readonly roleSubtitle = computed(() => {
    switch (this.currentRole()) {
      case Role.CLIENT:
        return 'Reserva clases y revisa tus paquetes activos';
      case Role.PROFESSOR:
        return 'Organiza clases del dia y asistencia';
      case Role.SUPERADMIN:
        return 'Gestion transversal de organizaciones y sedes';
      default:
        return 'Manage gym classes and sessions';
    }
  });

  protected readonly roleNavItems = computed(() => {
    switch (this.currentRole()) {
      case Role.CLIENT:
        return ['Mis clases', 'Mis paquetes'];
      case Role.PROFESSOR:
        return ['Mis sesiones', 'Asistencia'];
      case Role.SUPERADMIN:
        return ['Organizaciones', 'Sedes'];
      default:
        return ['Actividades', 'Horarios'];
    }
  });

  protected readonly activityCards = [
    { name: 'High Intensity', capacity: 20, durationMinutes: 45, active: true, label: 'HIIT' },
    { name: 'Power Lifting', capacity: 12, durationMinutes: 60, active: true, label: 'STRENGTH' },
    { name: 'Morning Flow', capacity: 15, durationMinutes: 30, active: false, label: 'YOGA' },
  ];

  protected readonly mobileTabs = ['Dashboard', 'Perfil', 'Logout'];

  protected async goToHome(): Promise<void> {
    await this.router.navigateByUrl('/');
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
