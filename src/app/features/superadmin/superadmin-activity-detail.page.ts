import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivitiesApi } from '../../core/api/activities.api';

@Component({
  selector: 'app-superadmin-activity-detail-page',
  templateUrl: './superadmin-activity-detail.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminActivityDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activitiesApi = inject(ActivitiesApi);

  protected readonly headquartersId = Number(this.route.snapshot.paramMap.get('headquartersId'));
  protected readonly activityId = Number(this.route.snapshot.paramMap.get('activityId'));

  protected readonly activity = toSignal(this.activitiesApi.getById(this.activityId), {
    initialValue: {
      id: this.activityId,
      hqId: this.headquartersId,
      name: 'Cargando...',
      description: '',
      isActive: true,
    },
  });

  protected async goBack(): Promise<void> {
    await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities`);
  }

  protected async editActivity(): Promise<void> {
    await this.router.navigateByUrl(
      `/headquarters/${this.headquartersId}/activities/${this.activityId}/edit`,
    );
  }

  protected async deleteActivity(): Promise<void> {
    await this.router.navigateByUrl(
      `/headquarters/${this.headquartersId}/activities/${this.activityId}/delete`,
    );
  }
}
