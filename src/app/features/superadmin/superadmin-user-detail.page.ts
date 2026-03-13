import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientPackagesApi } from '../../core/api/client-packages.api';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-superadmin-user-detail-page',
  templateUrl: './superadmin-user-detail.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUserDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  private readonly clientPackagesApi = inject(ClientPackagesApi);

  private readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  protected readonly user = toSignal(this.usersApi.getById(this.userId), {
    initialValue: null,
  });

  protected readonly fullName = computed(() => {
    const user = this.user();
    return user ? `${user.name} ${user.lastName}`.trim() : 'Cargando usuario';
  });

  protected readonly userPackages = toSignal(this.clientPackagesApi.getAll(this.userId), {
    initialValue: null,
  });
  protected readonly isLoading = computed(
    () => this.user() === null || this.userPackages() === null,
  );
  protected readonly packageItems = computed(() => this.userPackages() ?? []);
  protected readonly activePackages = computed(() =>
    this.packageItems().filter((item) => item.active),
  );
  protected readonly previousPackages = computed(() =>
    this.packageItems().filter((item) => !item.active),
  );

  protected async goBack(): Promise<void> {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    await this.router.navigateByUrl('/users');
  }
}
