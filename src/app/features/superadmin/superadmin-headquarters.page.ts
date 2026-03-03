import { computed, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { Headquarters } from '../../core/domain/models';

@Component({
  selector: 'app-superadmin-headquarters-page',
  templateUrl: './superadmin-headquarters.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminHeadquartersPage {
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly organizationsApi = inject(OrganizationsApi);

  protected readonly headquarters = signal<Headquarters[]>([]);
  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });
  protected readonly openHeadquartersMenuId = signal<number | null>(null);
  protected readonly deletingHeadquarters = signal<Headquarters | null>(null);
  protected readonly credentialEmail = signal('');
  protected readonly credentialPassword = signal('');
  protected readonly deleteError = signal<string | null>(null);

  constructor() {
    void this.loadHeadquarters();
  }

  protected readonly headquartersView = computed(() =>
    this.headquarters().map((hq) => ({
      ...hq,
      organizationName:
        this.organizations().find((organization) => organization.id === hq.organizationId)?.name ??
        `Org ${hq.organizationId}`,
    })),
  );

  protected async createHeadquarters(): Promise<void> {
    await this.router.navigateByUrl('/headquarters/create');
  }

  protected toggleHeadquartersMenu(headquartersId: number): void {
    this.openHeadquartersMenuId.update((current) =>
      current === headquartersId ? null : headquartersId,
    );
  }

  protected async viewHeadquarters(headquartersId: number): Promise<void> {
    this.openHeadquartersMenuId.set(null);
    await this.router.navigateByUrl(`/headquarters/${headquartersId}`);
  }

  protected async editHeadquarters(headquartersId: number): Promise<void> {
    this.openHeadquartersMenuId.set(null);
    await this.router.navigateByUrl(`/headquarters/${headquartersId}/edit`);
  }

  protected openDeleteModal(headquarters: Headquarters): void {
    this.openHeadquartersMenuId.set(null);
    this.deletingHeadquarters.set(headquarters);
    this.credentialEmail.set(this.authSession.user()?.email ?? '');
    this.credentialPassword.set('');
    this.deleteError.set(null);
  }

  protected closeDeleteModal(): void {
    this.deletingHeadquarters.set(null);
    this.credentialPassword.set('');
    this.deleteError.set(null);
  }

  protected onEmailInput(value: string): void {
    this.credentialEmail.set(value);
  }

  protected onPasswordInput(value: string): void {
    this.credentialPassword.set(value);
  }

  protected async confirmHeadquartersDelete(): Promise<void> {
    const selected = this.deletingHeadquarters();
    if (!selected) {
      return;
    }

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

    await firstValueFrom(this.headquartersApi.remove(selected.id));
    this.headquarters.update((items) => items.filter((item) => item.id !== selected.id));
    this.closeDeleteModal();
  }

  private async loadHeadquarters(): Promise<void> {
    const items = await firstValueFrom(this.headquartersApi.getAll());
    this.headquarters.set(items);
  }
}
