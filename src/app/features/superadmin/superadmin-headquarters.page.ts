import { computed, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';

@Component({
  selector: 'app-superadmin-headquarters-page',
  templateUrl: './superadmin-headquarters.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminHeadquartersPage {
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly organizationsApi = inject(OrganizationsApi);

  protected readonly headquarters = toSignal(this.headquartersApi.getAll(), { initialValue: [] });
  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });

  protected readonly headquartersView = computed(() =>
    this.headquarters().map((hq) => ({
      ...hq,
      organizationName:
        this.organizations().find((organization) => organization.id === hq.organizationId)?.name ??
        `Org ${hq.organizationId}`,
    })),
  );
}
