import { computed, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';

@Component({
  selector: 'app-superadmin-organizations-page',
  templateUrl: './superadmin-organizations.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminOrganizationsPage {
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly headquartersApi = inject(HeadquartersApi);

  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });
  protected readonly headquarters = toSignal(this.headquartersApi.getAll(), { initialValue: [] });

  protected readonly organizationsView = computed(() =>
    this.organizations().map((organization) => ({
      id: organization.id,
      name: organization.name,
      headquarters: this.headquarters().filter((hq) => hq.organizationId === organization.id)
        .length,
    })),
  );
}
