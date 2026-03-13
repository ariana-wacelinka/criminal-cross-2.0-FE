import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthSessionService } from '../../core/auth';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { Role } from '../../core/domain/models';

@Component({
  selector: 'app-superadmin-headquarters-detail-page',
  templateUrl: './superadmin-headquarters-detail.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminHeadquartersDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly organizationsApi = inject(OrganizationsApi);

  private readonly headquartersId = Number(this.route.snapshot.paramMap.get('headquartersId'));

  protected readonly headquarters = toSignal(this.headquartersApi.getById(this.headquartersId), {
    initialValue: null,
  });

  protected readonly organizations = toSignal(this.organizationsApi.getAll(), {
    initialValue: null,
  });
  protected readonly isLoading = computed(
    () => this.headquarters() === null || this.organizations() === null,
  );

  private readonly headquartersListPath = computed(() => {
    const role = this.authSession.user()?.roles[0];
    return role === Role.SUPERADMIN ? '/headquarters' : '/org-owner/headquarters';
  });

  protected readonly organizationName = computed(() => {
    const headquarters = this.headquarters();
    const organizations = this.organizations() ?? [];
    if (!headquarters) {
      return '';
    }
    return (
      organizations.find((organization) => organization.id === headquarters.organizationId)?.name ??
      'Organización no encontrada'
    );
  });

  protected async goBack(): Promise<void> {
    await this.router.navigateByUrl(this.headquartersListPath());
  }
}
