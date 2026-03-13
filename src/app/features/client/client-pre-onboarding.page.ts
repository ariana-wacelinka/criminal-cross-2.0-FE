import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom, of, switchMap } from 'rxjs';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { UsersApi } from '../../core/api/users.api';
import { AuthSessionService } from '../../core/auth';
import {
  ClientContextSelection,
  ClientContextService,
} from '../../core/client-context/client-context.service';
import { AuthenticatedUser, Role } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-client-pre-onboarding-page',
  templateUrl: './client-pre-onboarding.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPreOnboardingPage {
  private readonly router = inject(Router);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly usersApi = inject(UsersApi);
  private readonly authSession = inject(AuthSessionService);
  private readonly clientContext = inject(ClientContextService);
  private readonly toast = inject(UiToastService);

  protected readonly step = signal<'organization' | 'headquarters'>('organization');
  protected readonly selectedOrganizationId = signal<number | null>(null);
  protected readonly selectedHeadquartersId = signal<number | null>(null);

  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });

  protected readonly headquarters = toSignal(
    toObservable(this.selectedOrganizationId).pipe(
      switchMap((organizationId) =>
        organizationId ? this.headquartersApi.getAll(organizationId) : of([]),
      ),
    ),
    { initialValue: [] },
  );

  protected readonly selectedOrganizationName = computed(() => {
    const organizationId = this.selectedOrganizationId();
    if (!organizationId) {
      return '';
    }

    return (
      this.organizations().find((organization) => organization.id === organizationId)?.name ?? ''
    );
  });

  protected readonly canContinueOrganization = computed(
    () => this.selectedOrganizationId() !== null,
  );
  protected readonly canConfirmHeadquarters = computed(
    () => this.selectedHeadquartersId() !== null,
  );

  constructor() {
    const user = this.authSession.user();

    if (!user) {
      void this.router.navigateByUrl('/login');
      return;
    }

    if (!this.isClient(user) || user.roles.includes(Role.SUPERADMIN)) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }

    const existing = this.clientContext.current();
    if (existing) {
      this.selectedOrganizationId.set(existing.organizationId);
      this.selectedHeadquartersId.set(existing.headquartersId);
      void this.router.navigateByUrl('/client/dashboard');
      return;
    }

    const inferred = this.inferSelectionFromUser(user);
    if (inferred) {
      this.clientContext.save(inferred);
      this.selectedOrganizationId.set(inferred.organizationId);
      this.selectedHeadquartersId.set(inferred.headquartersId);
      void this.router.navigateByUrl('/client/dashboard');
      return;
    }

    this.selectedOrganizationId.set(user.organization?.id ?? null);
  }

  private isClient(user: AuthenticatedUser): boolean {
    return Array.isArray(user.roles) && user.roles.includes(Role.CLIENT);
  }

  private inferSelectionFromUser(user: AuthenticatedUser): ClientContextSelection | null {
    const organizationId = user.organization?.id ?? null;
    const headquartersId = user.headquarters?.[0]?.id ?? null;

    if (!organizationId || !headquartersId) {
      return null;
    }

    return { organizationId, headquartersId };
  }

  protected selectOrganization(organizationId: number): void {
    this.selectedOrganizationId.set(organizationId);
    this.selectedHeadquartersId.set(null);
  }

  protected continueToHeadquarters(): void {
    if (!this.canContinueOrganization()) {
      return;
    }
    this.step.set('headquarters');
  }

  protected backToOrganization(): void {
    this.step.set('organization');
    this.selectedHeadquartersId.set(null);
  }

  protected selectHeadquarters(headquartersId: number): void {
    this.selectedHeadquartersId.set(headquartersId);
  }

  protected async confirmSelection(): Promise<void> {
    const organizationId = this.selectedOrganizationId();
    const headquartersId = this.selectedHeadquartersId();
    const firebaseUid = this.authSession.user()?.firebaseUid;

    if (!organizationId || !headquartersId || !firebaseUid) {
      this.toast.show('Selecciona una organización y sede para continuar.', 'info');
      return;
    }

    try {
      await firstValueFrom(this.usersApi.assignToHeadquarters(firebaseUid, headquartersId));
      this.clientContext.save({ organizationId, headquartersId });
      this.toast.success('Listo, ya ingresaste a tu sede.');
      await this.router.navigateByUrl('/client/dashboard');
    } catch {
      this.toast.error('No se pudo vincular tu usuario a la sede. Intenta nuevamente.');
    }
  }
}
