import { computed, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs';
import { AuthSessionService } from '../../core/auth';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { Headquarters } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

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
  private readonly toast = inject(UiToastService);

  protected readonly currentPage = signal(0);
  protected readonly pageSize = 8;
  private readonly refreshTick = signal(0);

  private readonly paginationRequest = computed(() => ({
    page: this.currentPage(),
    size: this.pageSize,
    tick: this.refreshTick(),
  }));

  protected readonly headquartersPage = toSignal(
    toObservable(this.paginationRequest).pipe(
      switchMap(({ page, size }) => this.headquartersApi.getPage(page, size)),
    ),
    { initialValue: null },
  );
  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });
  protected readonly headquarters = computed(() => this.headquartersPage()?.items ?? []);
  protected readonly openHeadquartersMenuId = signal<number | null>(null);
  protected readonly deletingHeadquarters = signal<Headquarters | null>(null);
  protected readonly credentialEmail = signal('');
  protected readonly credentialPassword = signal('');
  protected readonly deleteError = signal<string | null>(null);
  protected readonly isLoading = computed(() => !this.headquartersPage());
  protected readonly hasItems = computed(() => this.headquarters().length > 0);
  protected readonly totalPages = computed(() => {
    const total = this.headquartersPage()?.total ?? 0;
    const size = this.headquartersPage()?.size ?? this.pageSize;
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });
  protected readonly canGoPrev = computed(() => this.currentPage() > 0);
  protected readonly canGoNext = computed(() => this.currentPage() < this.totalPages() - 1);

  protected readonly headquartersView = computed(() =>
    this.headquarters().map((hq) => ({
      ...hq,
      organizationName:
        this.organizations().find((organization) => organization.id === hq.organizationId)?.name ??
        `Org ${hq.organizationId}`,
    })),
  );

  protected readonly pageLabel = computed(() => {
    const page = this.headquartersPage();
    if (!page || !page.total) {
      return 'Sin resultados';
    }
    const start = page.page * page.size + 1;
    const end = Math.min((page.page + 1) * page.size, page.total);
    return `${start}-${end} de ${page.total}`;
  });

  protected async createHeadquarters(): Promise<void> {
    await this.router.navigateByUrl('/headquarters/create');
  }

  protected previousPage(): void {
    if (!this.canGoPrev()) {
      return;
    }
    this.currentPage.update((page) => page - 1);
    this.openHeadquartersMenuId.set(null);
  }

  protected nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }
    this.currentPage.update((page) => page + 1);
    this.openHeadquartersMenuId.set(null);
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

  protected async viewActivities(headquartersId: number): Promise<void> {
    this.openHeadquartersMenuId.set(null);
    await this.router.navigateByUrl(`/headquarters/${headquartersId}/activities`);
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
      this.deleteError.set('Completa email y contraseña para confirmar.');
      return;
    }

    const sessionEmail = this.authSession.user()?.email;
    if (
      sessionEmail &&
      sessionEmail.toLowerCase() !== this.credentialEmail().trim().toLowerCase()
    ) {
      this.deleteError.set('El email no coincide con la sesión activa.');
      return;
    }

    if (this.credentialPassword().trim().length < 6) {
      this.deleteError.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await firstValueFrom(this.headquartersApi.remove(selected.id));

      const pageAfterDelete = this.headquartersPage();
      const isLastItemOnPage = !!pageAfterDelete && (pageAfterDelete.items?.length ?? 0) === 1;
      if (isLastItemOnPage && this.currentPage() > 0) {
        this.currentPage.update((page) => page - 1);
      }

      this.refreshTick.update((value) => value + 1);
      this.closeDeleteModal();
      this.toast.success('Sede eliminada.');
    } catch {
      this.deleteError.set('No se pudo eliminar la sede. Intenta nuevamente.');
      this.toast.error('No se pudo eliminar la sede.');
    }
  }
}
