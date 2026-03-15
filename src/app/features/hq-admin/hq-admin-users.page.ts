import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { UserScopeService } from '../../core/auth';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-hq-admin-users-page',
  templateUrl: './hq-admin-users.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HqAdminUsersPage {
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  private readonly userScope = inject(UserScopeService);
  private readonly headquartersId = computed(() => this.userScope.defaultHeadquartersId());
  protected readonly openUserMenuId = signal<number | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly searchQuery = signal('');
  protected readonly pageSize = 10;

  private readonly usersRequest = computed(() => ({
    headquartersId: this.headquartersId(),
    page: this.currentPage(),
    search: this.searchQuery().trim(),
  }));

  protected readonly usersPage = toSignal(
    toObservable(this.usersRequest).pipe(
      switchMap(({ headquartersId, page, search }) => {
        if (!headquartersId) {
          return of({ items: [], total: 0, page: 0, size: this.pageSize });
        }

        return this.usersApi.getUsersByHq(headquartersId, page, this.pageSize, search || undefined);
      }),
    ),
    { initialValue: null },
  );

  protected readonly users = computed(() => this.usersPage()?.items ?? []);
  protected readonly isLoading = computed(() => !this.usersPage());
  protected readonly hasItems = computed(() => this.users().length > 0);
  protected readonly totalPages = computed(() => {
    const total = this.usersPage()?.total ?? 0;
    const size = this.usersPage()?.size ?? this.pageSize;
    return Math.max(1, Math.ceil(total / Math.max(1, size)));
  });
  protected readonly canGoPrev = computed(() => this.currentPage() > 0);
  protected readonly canGoNext = computed(() => this.currentPage() < this.totalPages() - 1);
  protected readonly pageLabel = computed(() => {
    const page = this.usersPage();
    if (!page || !page.total) {
      return 'Sin resultados';
    }
    const start = page.page * page.size + 1;
    const end = Math.min((page.page + 1) * page.size, page.total);
    return `${start}-${end} de ${page.total}`;
  });

  protected previousPage(): void {
    if (!this.canGoPrev()) {
      return;
    }
    this.currentPage.update((page) => page - 1);
    this.openUserMenuId.set(null);
  }

  protected nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }
    this.currentPage.update((page) => page + 1);
    this.openUserMenuId.set(null);
  }

  protected toggleUserMenu(userId: number): void {
    this.openUserMenuId.update((current) => (current === userId ? null : userId));
  }

  protected async viewUser(userId: number): Promise<void> {
    this.openUserMenuId.set(null);
    await this.router.navigateByUrl(`/users/${userId}`);
  }

  protected async editUser(userId: number): Promise<void> {
    this.openUserMenuId.set(null);
    await this.router.navigateByUrl(`/users/${userId}/edit`);
  }

  protected async deleteUser(userId: number): Promise<void> {
    this.openUserMenuId.set(null);
    await this.router.navigateByUrl(`/users/${userId}/delete`);
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(0);
    this.openUserMenuId.set(null);
  }
}
