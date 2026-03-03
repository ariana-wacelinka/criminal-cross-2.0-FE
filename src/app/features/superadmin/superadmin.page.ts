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

  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });
  protected readonly headquarters = toSignal(this.headquartersApi.getAll(), { initialValue: [] });
  protected readonly users = toSignal(this.usersApi.getAll(), { initialValue: [] });

  protected readonly organizationsView = computed(() =>
    this.organizations().map((organization) => ({
      id: organization.id,
      name: organization.name,
      headquarters: this.headquarters().filter((hq) => hq.organizationId === organization.id)
        .length,
    })),
  );

  protected readonly totalOrganizations = computed(() => this.organizations().length);
  protected readonly totalHeadquarters = computed(() => this.headquarters().length);
  protected readonly totalUsers = computed(() => this.users().length);
}
