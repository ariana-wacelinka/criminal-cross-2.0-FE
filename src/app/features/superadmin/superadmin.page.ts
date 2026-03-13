import { computed, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-superadmin-page',
  templateUrl: './superadmin.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminPage {
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly usersApi = inject(UsersApi);

  protected readonly organizationsPage = toSignal(this.organizationsApi.getPage(0, 9), {
    initialValue: null,
  });
  protected readonly headquartersPage = toSignal(this.headquartersApi.getPage(0, 1), {
    initialValue: null,
  });
  protected readonly usersPage = toSignal(this.usersApi.getPage(0, 4), {
    initialValue: null,
  });

  protected readonly isLoading = computed(
    () => !this.organizationsPage() || !this.headquartersPage() || !this.usersPage(),
  );

  protected readonly organizationsView = computed(() => this.organizationsPage()?.items ?? []);
  protected readonly usersView = computed(() => this.usersPage()?.items ?? []);
  protected readonly hasOrganizations = computed(() => this.organizationsView().length > 0);
  protected readonly hasUsers = computed(() => this.usersView().length > 0);

  protected readonly totalOrganizations = computed(() => this.organizationsPage()?.total ?? 0);
  protected readonly totalHeadquarters = computed(() => this.headquartersPage()?.total ?? 0);
  protected readonly totalUsers = computed(() => this.usersPage()?.total ?? 0);
}
