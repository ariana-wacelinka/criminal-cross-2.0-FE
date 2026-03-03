import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';

@Component({
  selector: 'app-superadmin-headquarters-detail-page',
  templateUrl: './superadmin-headquarters-detail.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminHeadquartersDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly organizationsApi = inject(OrganizationsApi);

  private readonly headquartersId = Number(this.route.snapshot.paramMap.get('headquartersId'));

  protected readonly headquarters = toSignal(this.headquartersApi.getById(this.headquartersId), {
    initialValue: {
      id: this.headquartersId,
      organizationId: 0,
      name: 'Cargando...',
      activities: [],
    },
  });

  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });

  protected readonly organizationName = computed(
    () =>
      this.organizations().find(
        (organization) => organization.id === this.headquarters().organizationId,
      )?.name ?? 'Organizacion no encontrada',
  );

  protected async goBack(): Promise<void> {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    await this.router.navigateByUrl('/headquarters');
  }
}
