import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-activity-edit-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-activity-edit.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminActivityEditPage {
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
      name: '',
      description: '',
      isActive: true,
    },
  });

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const current = this.activity();
      if (current?.id === this.activityId) {
        this.form.patchValue(
          {
            name: current.name,
            description: current.description,
          },
          { emitEvent: false },
        );
      }
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const current = this.activity();

    try {
      await firstValueFrom(
        this.activitiesApi.update(this.activityId, {
          id: this.activityId,
          name: this.form.controls.name.value,
          description: this.form.controls.description.value,
          isActive: current.isActive,
        }),
      );
      this.toast.success('Actividad actualizada.');
      await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities`);
    } catch {
      this.toast.error('No se pudo actualizar la actividad.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities`);
  }
}
