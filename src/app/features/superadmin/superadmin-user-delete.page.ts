import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-superadmin-user-delete-page',
  templateUrl: './superadmin-user-delete.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUserDeletePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);

  private readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  protected readonly user = toSignal(this.usersApi.getById(this.userId), {
    initialValue: {
      id: this.userId,
      name: 'Cargando',
      lastName: 'usuario',
      email: '',
      firebaseUid: '',
      roles: [],
      active: true,
    },
  });

  protected async confirmDelete(): Promise<void> {
    await firstValueFrom(this.usersApi.remove(this.userId));
    await this.router.navigateByUrl('/users');
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/users');
  }
}
