import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrganizationsApi } from '../../core/api/organizations.api';

@Component({
  selector: 'app-superadmin-organization-create-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-organization-create.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminOrganizationCreatePage {
  private readonly router = inject(Router);
  private readonly organizationsApi = inject(OrganizationsApi);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    await firstValueFrom(this.organizationsApi.create({ name: this.form.controls.name.value }));
    await this.router.navigateByUrl('/organizations');
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/organizations');
  }
}
