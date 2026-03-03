import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-activity-delete-page',
  templateUrl: './superadmin-activity-delete.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminActivityDeletePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly toast = inject(UiToastService);

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

  protected async confirmDelete(): Promise<void> {
    try {
      await firstValueFrom(this.activitiesApi.remove(this.activityId));
      this.toast.success('Actividad eliminada.');
      await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities`);
    } catch {
      this.toast.error('No se pudo eliminar la actividad.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities`);
  }
}
