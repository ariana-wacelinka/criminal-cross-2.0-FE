import { computed, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';

@Component({
  selector: 'app-superadmin-organizations-page',
  templateUrl: './superadmin-organizations.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminOrganizationsPage {
  private readonly router = inject(Router);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  protected readonly openMenuOrganizationId = signal<number | null>(null);

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

  protected toggleMenu(organizationId: number): void {
    this.openMenuOrganizationId.update((current) =>
      current === organizationId ? null : organizationId,
    );
  }

  protected async createOrganization(): Promise<void> {
    await this.router.navigateByUrl('/organizations/create');
  }

  protected async viewOrganization(organizationId: number): Promise<void> {
    this.openMenuOrganizationId.set(null);
    await this.router.navigateByUrl(`/organizations/${organizationId}`);
  }

  protected async editOrganization(organizationId: number): Promise<void> {
    this.openMenuOrganizationId.set(null);
    await this.router.navigateByUrl(`/organizations/${organizationId}/edit`);
  }

  protected async deleteOrganization(organizationId: number): Promise<void> {
    this.openMenuOrganizationId.set(null);
    await this.router.navigateByUrl(`/organizations/${organizationId}/delete`);
  }
}
