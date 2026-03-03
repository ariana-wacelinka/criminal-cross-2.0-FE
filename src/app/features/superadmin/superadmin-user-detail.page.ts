import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-superadmin-user-detail-page',
  templateUrl: './superadmin-user-detail.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUserDetailPage {
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

  protected readonly fullName = computed(() =>
    `${this.user().name} ${this.user().lastName}`.trim(),
  );

  protected async goBack(): Promise<void> {
    await this.router.navigateByUrl('/users');
  }
}
