import { computed, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';

@Component({
  selector: 'app-superadmin-organizations-page',
  templateUrl: './superadmin-organizations.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminOrganizationsPage {
  private readonly router = inject(Router);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  protected readonly openMenuOrganizationId = signal<number | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly pageSize = 6;

  protected readonly organizationsPage = toSignal(
    toObservable(this.currentPage).pipe(
      switchMap((page) => this.organizationsApi.getPage(page, this.pageSize)),
    ),
    {
      initialValue: {
        items: [],
        total: 0,
        page: 0,
        size: this.pageSize,
      },
    },
  );
  protected readonly headquarters = toSignal(this.headquartersApi.getAll(), { initialValue: [] });
  protected readonly hasItems = computed(() => this.organizationsPage().items.length > 0);
  protected readonly totalPages = computed(() => {
    const { total, size } = this.organizationsPage();
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });
  protected readonly canGoPrev = computed(() => this.currentPage() > 0);
  protected readonly canGoNext = computed(() => this.currentPage() < this.totalPages() - 1);

  protected readonly organizationsView = computed(() =>
    this.organizationsPage().items.map((organization) => ({
      id: organization.id,
      name: organization.name,
      headquarters: this.headquarters().filter((hq) => hq.organizationId === organization.id)
        .length,
    })),
  );

  protected readonly pageLabel = computed(() => {
    const page = this.organizationsPage();
    if (!page.total) {
      return 'Sin resultados';
    }
    const start = page.page * page.size + 1;
    const end = Math.min((page.page + 1) * page.size, page.total);
    return `${start}-${end} de ${page.total}`;
  });

  protected toggleMenu(organizationId: number): void {
    this.openMenuOrganizationId.update((current) =>
      current === organizationId ? null : organizationId,
    );
  }

  protected async createOrganization(): Promise<void> {
    await this.router.navigateByUrl('/organizations/create');
  }

  protected previousPage(): void {
    if (!this.canGoPrev()) {
      return;
    }
    this.currentPage.update((page) => page - 1);
    this.openMenuOrganizationId.set(null);
  }

  protected nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }
    this.currentPage.update((page) => page + 1);
    this.openMenuOrganizationId.set(null);
  }

  protected async viewOrganization(organizationId: number): Promise<void> {
    this.openMenuOrganizationId.set(null);
    await this.router.navigateByUrl(`/organizations/${organizationId}`);
  }

  protected async editOrganization(organizationId: number): Promise<void> {
    this.openMenuOrganizationId.set(null);
    await this.router.navigateByUrl(`/organizations/${organizationId}/edit`);
  }

  protected async deleteOrganization(organizationId: number): Promise<void> {
    this.openMenuOrganizationId.set(null);
    await this.router.navigateByUrl(`/organizations/${organizationId}/delete`);
  }
}
