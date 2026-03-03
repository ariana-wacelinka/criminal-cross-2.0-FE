import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UsersApi } from '../../core/api/users.api';
import { UiToastService } from '../../core/ui/toast.service';

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
  private readonly toast = inject(UiToastService);

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
    try {
      await firstValueFrom(this.usersApi.remove(this.userId));
      this.toast.success('Usuario eliminado.');
      await this.router.navigateByUrl('/users');
    } catch {
      this.toast.error('No se pudo eliminar el usuario.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/users');
  }
}
