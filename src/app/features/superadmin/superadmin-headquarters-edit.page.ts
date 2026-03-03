import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { OrganizationsApi } from '../../core/api/organizations.api';

@Component({
  selector: 'app-superadmin-headquarters-edit-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-headquarters-edit.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminHeadquartersEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly organizationsApi = inject(OrganizationsApi);

  private readonly headquartersId = Number(this.route.snapshot.paramMap.get('headquartersId'));

  protected readonly organizations = toSignal(this.organizationsApi.getAll(), { initialValue: [] });
  protected readonly headquarters = toSignal(this.headquartersApi.getById(this.headquartersId), {
    initialValue: { id: this.headquartersId, organizationId: 0, name: '' },
  });

  protected readonly form = new FormGroup({
    organizationId: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const current = this.headquarters();
      if (current) {
        this.form.patchValue(
          {
            organizationId: current.organizationId,
            name: current.name,
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

    await firstValueFrom(
      this.headquartersApi.update(this.headquartersId, {
        organizationId: this.form.controls.organizationId.value,
        name: this.form.controls.name.value,
      }),
    );

    await this.router.navigateByUrl('/headquarters');
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/headquarters');
  }
}
