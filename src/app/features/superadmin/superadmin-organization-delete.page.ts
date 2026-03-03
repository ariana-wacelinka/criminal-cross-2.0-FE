import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-organization-delete-page',
  templateUrl: './superadmin-organization-delete.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminOrganizationDeletePage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authSession = inject(AuthSessionService);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly toast = inject(UiToastService);

  private readonly organizationId = Number(this.route.snapshot.paramMap.get('organizationId'));

  protected readonly organization = toSignal(this.organizationsApi.getById(this.organizationId), {
    initialValue: { id: this.organizationId, name: 'Cargando...' },
  });

  protected readonly confirmModalOpen = signal(false);
  protected readonly credentialEmail = signal('');
  protected readonly credentialPassword = signal('');
  protected readonly deleteError = signal<string | null>(null);

  protected async confirmDelete(): Promise<void> {
    this.confirmModalOpen.set(true);
    this.credentialEmail.set(this.authSession.user()?.email ?? '');
    this.credentialPassword.set('');
    this.deleteError.set(null);
  }

  protected closeConfirmModal(): void {
    this.confirmModalOpen.set(false);
    this.credentialPassword.set('');
    this.deleteError.set(null);
  }

  protected onEmailInput(value: string): void {
    this.credentialEmail.set(value);
  }

  protected onPasswordInput(value: string): void {
    this.credentialPassword.set(value);
  }

  protected async confirmDeleteWithCredentials(): Promise<void> {
    if (!this.credentialEmail().trim() || !this.credentialPassword().trim()) {
      this.deleteError.set('Completa email y contrasena para confirmar.');
      return;
    }

    const sessionEmail = this.authSession.user()?.email;
    if (
      sessionEmail &&
      sessionEmail.toLowerCase() !== this.credentialEmail().trim().toLowerCase()
    ) {
      this.deleteError.set('El email no coincide con la sesion activa.');
      return;
    }

    if (this.credentialPassword().trim().length < 6) {
      this.deleteError.set('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await firstValueFrom(this.organizationsApi.remove(this.organizationId));
      this.closeConfirmModal();
      this.toast.success('Organizacion eliminada.');
      await this.router.navigateByUrl('/organizations');
    } catch {
      this.deleteError.set('No se pudo eliminar la organizacion. Intenta nuevamente.');
      this.toast.error('No se pudo eliminar la organizacion.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/organizations');
  }
}
