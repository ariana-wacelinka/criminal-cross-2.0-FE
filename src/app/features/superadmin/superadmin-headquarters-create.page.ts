import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-headquarters-create-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-headquarters-create.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminHeadquartersCreatePage {
  private readonly router = inject(Router);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly organizationsApi = inject(OrganizationsApi);
  private readonly toast = inject(UiToastService);

  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });

  protected readonly form = new FormGroup({
    organizationId: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected async save(): Promise<void> {
    if (this.form.invalid || !this.form.controls.organizationId.value) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      await firstValueFrom(
        this.headquartersApi.create({
          organizationId: this.form.controls.organizationId.value,
          name: this.form.controls.name.value,
        }),
      );
      this.toast.success('Sede creada correctamente.');
      await this.router.navigateByUrl('/headquarters');
    } catch {
      this.toast.error('No se pudo crear la sede.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/headquarters');
  }
}
