import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { UsersApi } from '../../core/api/users.api';
import { Role } from '../../core/domain/models';
import { UserScopeService } from '../../core/auth';

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
  private readonly userScope = inject(UserScopeService);
  private readonly organizationId = computed(() => this.userScope.organizationId());

  protected readonly organization = toSignal(
    toObservable(this.organizationId).pipe(
      switchMap((organizationId) =>
        organizationId
          ? this.organizationsApi.getById(organizationId)
          : of({ id: 0, name: 'Organización' }),
      ),
    ),
    { initialValue: { id: 0, name: 'Organización' } },
  );
  protected readonly headquartersPage = toSignal(
    toObservable(this.organizationId).pipe(
      switchMap((organizationId) =>
        organizationId
          ? this.headquartersApi.getPage(0, 6, organizationId)
          : of({ items: [], total: 0, page: 0, size: 6 }),
      ),
    ),
    { initialValue: null },
  );
  protected readonly usersPage = toSignal(
    toObservable(this.organizationId).pipe(
      switchMap((organizationId) =>
        organizationId
          ? this.usersApi.getUsersByOrg(organizationId, 0, 12)
          : of({ items: [], total: 0, page: 0, size: 12 }),
      ),
    ),
    { initialValue: null },
  );

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
