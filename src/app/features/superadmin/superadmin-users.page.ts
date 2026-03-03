import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
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

  protected readonly users = toSignal(this.usersApi.getAll(), { initialValue: [] });

  protected async createUser(): Promise<void> {
    await this.router.navigateByUrl('/users/create');
  }

  protected toggleUserMenu(userId: number): void {
    this.openUserMenuId.update((current) => (current === userId ? null : userId));
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
}
