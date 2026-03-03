import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CreateUserRequest, UsersApi } from '../../core/api/users.api';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-user-create-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-user-create.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUserCreatePage {
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  private readonly toast = inject(UiToastService);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateUserRequest = {
      name: this.form.controls.name.value,
      lastName: this.form.controls.lastName.value,
      email: this.form.controls.email.value,
    };

    try {
      await firstValueFrom(this.usersApi.create(payload));
      this.toast.success('Usuario creado correctamente.');
      await this.router.navigateByUrl('/users');
    } catch {
      this.toast.error('No se pudo crear el usuario.');
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/users');
  }
}
