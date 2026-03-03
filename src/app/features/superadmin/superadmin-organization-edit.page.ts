import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-organization-edit-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-organization-edit.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminOrganizationEditPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly toast = inject(UiToastService);

  private readonly organizationId = Number(this.route.snapshot.paramMap.get('organizationId'));

  protected readonly organization = toSignal(this.organizationsApi.getById(this.organizationId), {
    initialValue: { id: this.organizationId, name: '' },
  });

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const current = this.organization();
      if (current?.name) {
        this.form.patchValue({ name: current.name }, { emitEvent: false });
      }
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      await firstValueFrom(
        this.organizationsApi.update(this.organizationId, {
          name: this.form.controls.name.value,
        }),
      );
      this.toast.success('Organizacion actualizada.');
      await this.router.navigateByUrl('/organizations');
    } catch {
      this.toast.error('No se pudo actualizar la organizacion.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/organizations');
  }
}
