import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { GymConfigApi } from '../../core/api/gym-config.api';
import { WaitlistStrategy } from '../../core/domain/models';
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
  private readonly gymConfigApi = inject(GymConfigApi);
  private readonly toast = inject(UiToastService);

  protected readonly headquartersId = Number(this.route.snapshot.paramMap.get('headquartersId'));
  protected readonly activityId = Number(this.route.snapshot.paramMap.get('activityId'));
  private readonly organizationId = 1;

  protected readonly activity = toSignal(this.activitiesApi.getById(this.activityId), {
    initialValue: null,
  });

  protected readonly activityConfig = toSignal(
    this.gymConfigApi
      .getEffective({
        organizationId: this.organizationId,
        headquartersId: this.headquartersId,
        activityId: this.activityId,
      })
      .pipe(
        catchError(() =>
          of({
            maxParticipants: 20,
            waitlistEnabled: false,
            waitlistMaxSize: 0,
            waitlistStrategy: WaitlistStrategy.FIFO,
            cancellationMinHoursBeforeStart: 0,
            cancellationAllowLateCancel: true,
          }),
        ),
      ),
    {
      initialValue: null,
    },
  );
  protected readonly isLoading = computed(
    () => this.activity() === null || this.activityConfig() === null,
  );

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    maxParticipants: new FormControl<number | null>(20, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  constructor() {
    effect(() => {
      const current = this.activity();
      const config = this.activityConfig();
      if (current?.id === this.activityId && config) {
        this.form.patchValue(
          {
            name: current.name,
            description: current.description,
            maxParticipants: config.maxParticipants,
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
    const config = this.activityConfig();
    if (!current || !config) {
      return;
    }

    try {
      await firstValueFrom(
        this.activitiesApi.update(this.activityId, {
          id: this.activityId,
          name: this.form.controls.name.value,
          description: this.form.controls.description.value,
          isActive: current.isActive,
        }),
      );

      await firstValueFrom(
        this.gymConfigApi.updateActivity(this.activityId, {
          maxParticipants: this.form.controls.maxParticipants.value ?? config.maxParticipants ?? 20,
          waitlistEnabled: config.waitlistEnabled,
          waitlistMaxSize: config.waitlistMaxSize,
          waitlistStrategy: config.waitlistStrategy,
          cancellationMinHoursBeforeStart: config.cancellationMinHoursBeforeStart,
          cancellationAllowLateCancel: config.cancellationAllowLateCancel,
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
