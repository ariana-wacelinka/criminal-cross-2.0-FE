import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-superadmin-users-page',
  templateUrl: './superadmin-users.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUsersPage {
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  protected readonly openUserMenuId = signal<number | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly searchQuery = signal('');
  protected readonly pageSize = 10;

  private readonly usersRequest = computed(() => ({
    page: this.currentPage(),
    search: this.searchQuery().trim(),
  }));

  protected readonly usersPage = toSignal(
    toObservable(this.usersRequest).pipe(
      switchMap(({ page, search }) =>
        this.usersApi.getPage(page, this.pageSize, search || undefined),
      ),
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

  protected toggleUserMenu(userId: number): void {
    this.openUserMenuId.update((current) => (current === userId ? null : userId));
  }

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

  protected async viewUser(userId: number): Promise<void> {
    this.openUserMenuId.set(null);
    await this.router.navigateByUrl(`/users/${userId}`);
  }

  protected async editUserRoles(userId: number): Promise<void> {
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
