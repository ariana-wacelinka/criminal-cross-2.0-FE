import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CreateUserRequest, UsersApi } from '../../core/api/users.api';

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

    await firstValueFrom(this.usersApi.create(payload));
    await this.router.navigateByUrl('/users');
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/users');
  }
}
