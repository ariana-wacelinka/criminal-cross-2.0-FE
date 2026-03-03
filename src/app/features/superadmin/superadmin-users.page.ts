import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-superadmin-users-page',
  templateUrl: './superadmin-users.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUsersPage {
  private readonly usersApi = inject(UsersApi);

  protected readonly users = toSignal(this.usersApi.getAll(), { initialValue: [] });
}
