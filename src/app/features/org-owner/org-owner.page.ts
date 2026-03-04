import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { UsersApi } from '../../core/api/users.api';
import { Role } from '../../core/domain/models';

@Component({
  selector: 'app-org-owner-page',
  templateUrl: './org-owner.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgOwnerPage {
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly usersApi = inject(UsersApi);

  private readonly organizationId = 1;

  protected readonly organization = toSignal(this.organizationsApi.getById(this.organizationId), {
    initialValue: { id: this.organizationId, name: 'Organizacion' },
  });
  protected readonly headquartersPage = toSignal(
    this.headquartersApi.getPage(0, 6, this.organizationId),
    { initialValue: null },
  );
  protected readonly usersPage = toSignal(this.usersApi.getPage(0, 12), { initialValue: null });

  protected readonly isLoading = computed(() => !this.headquartersPage() || !this.usersPage());
  protected readonly headquarters = computed(() => this.headquartersPage()?.items ?? []);
  protected readonly orgUsers = computed(() =>
    (this.usersPage()?.items ?? []).filter(
      (user) => user.roles.includes(Role.ORG_OWNER) || user.roles.includes(Role.ORG_ADMIN),
    ),
  );

  protected readonly totalHeadquarters = computed(() => this.headquartersPage()?.total ?? 0);
  protected readonly totalManagers = computed(() => this.orgUsers().length);
}
