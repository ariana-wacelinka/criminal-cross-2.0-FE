import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { firstValueFrom, of, switchMap } from 'rxjs';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { Headquarters } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-org-owner-headquarters-page',
  templateUrl: './org-owner-headquarters.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgOwnerHeadquartersPage {
  private readonly router = inject(Router);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly toast = inject(UiToastService);

  private readonly ownerHeadquarters = toSignal(this.headquartersApi.getAll(), {
    initialValue: [],
  });
  private readonly organizationId = computed(
    () => this.ownerHeadquarters()[0]?.organizationId ?? null,
  );
  protected readonly currentPage = signal(0);
  protected readonly pageSize = 10;
  private readonly refreshTick = signal(0);
  protected readonly openHeadquartersMenuId = signal<number | null>(null);
  protected readonly deletingHeadquarters = signal<Headquarters | null>(null);

  protected readonly page = toSignal(
    toObservable(
      computed(() => ({
        page: this.currentPage(),
        tick: this.refreshTick(),
        organizationId: this.organizationId(),
      })),
    ).pipe(
      switchMap(({ page, organizationId }) => {
        if (!organizationId) {
          return of({ items: [], total: 0, page: 0, size: this.pageSize });
        }
        return this.headquartersApi.getPage(page, this.pageSize, organizationId);
      }),
    ),
    { initialValue: null },
  );

  protected readonly isLoading = computed(() => !this.page());
  protected readonly headquarters = computed(() => this.page()?.items ?? []);
  protected readonly canGoPrev = computed(() => this.currentPage() > 0);
  protected readonly canGoNext = computed(() => {
    const total = this.page()?.total ?? 0;
    return this.currentPage() < Math.ceil(total / Math.max(1, this.pageSize)) - 1;
  });

  protected async viewActivities(headquartersId: number): Promise<void> {
    this.openHeadquartersMenuId.set(null);
    await this.router.navigateByUrl(`/headquarters/${headquartersId}/activities`);
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
  }

  protected closeDeleteModal(): void {
    this.deletingHeadquarters.set(null);
  }

  protected async confirmHeadquartersDelete(): Promise<void> {
    const headquarters = this.deletingHeadquarters();
    if (!headquarters) {
      return;
    }

    try {
      await firstValueFrom(this.headquartersApi.remove(headquarters.id));

      const pageAfterDelete = this.page();
      const isLastItemOnPage = !!pageAfterDelete && pageAfterDelete.items.length === 1;
      if (isLastItemOnPage && this.currentPage() > 0) {
        this.currentPage.update((page) => page - 1);
      }

      this.refreshTick.update((value) => value + 1);
      this.closeDeleteModal();
      this.toast.success('Sede eliminada.');
    } catch {
      this.toast.error('No se pudo eliminar la sede.');
    }
  }

  protected previousPage(): void {
    if (this.canGoPrev()) {
      this.currentPage.update((value) => value - 1);
      this.openHeadquartersMenuId.set(null);
    }
  }

  protected nextPage(): void {
    if (this.canGoNext()) {
      this.currentPage.update((value) => value + 1);
      this.openHeadquartersMenuId.set(null);
    }
  }
}
