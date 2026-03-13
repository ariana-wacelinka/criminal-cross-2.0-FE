import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { GymConfigApi } from '../../core/api/gym-config.api';
import { WaitlistStrategy } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-activity-create-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-activity-create.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminActivityCreatePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly gymConfigApi = inject(GymConfigApi);
  private readonly toast = inject(UiToastService);

  protected readonly headquartersId = Number(this.route.snapshot.paramMap.get('headquartersId'));

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    maxParticipants: new FormControl<number | null>(20, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const activity = await firstValueFrom(
        this.activitiesApi.create({
          hqId: this.headquartersId,
          name: this.form.controls.name.value,
          description: this.form.controls.description.value,
        }),
      );

      await firstValueFrom(
        this.gymConfigApi.updateActivity(activity.id, {
          maxParticipants: this.form.controls.maxParticipants.value ?? 20,
          waitlistEnabled: false,
          waitlistMaxSize: 0,
          waitlistStrategy: WaitlistStrategy.FIFO,
          cancellationMinHoursBeforeStart: 0,
          cancellationAllowLateCancel: true,
        }),
      );

      this.toast.success('Actividad creada.');
      await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities`);
    } catch {
      this.toast.error('No se pudo crear la actividad.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities`);
  }
}
