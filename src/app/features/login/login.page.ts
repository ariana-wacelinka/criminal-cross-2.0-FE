import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Role } from '../../core/domain/models';
import { AuthFacadeService } from '../../core/auth';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authFacade = inject(AuthFacadeService);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly roles = [
    { value: Role.CLIENT, label: 'Cliente' },
    { value: Role.PROFESSOR, label: 'Profesor' },
    { value: Role.ORG_ADMIN, label: 'Admin sede' },
    { value: Role.ORG_OWNER, label: 'Dueño de organización' },
    { value: Role.SUPERADMIN, label: 'Superadmin' },
  ];

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    role: new FormControl(Role.ORG_ADMIN, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected setMode(nextMode: 'login' | 'register'): void {
    this.mode.set(nextMode);
    this.errorMessage.set(null);
  }

  protected async submit(): Promise<void> {
    if (this.mode() === 'register') {
      await this.register();
      return;
    }

    await this.login();
  }

  protected async login(): Promise<void> {
    if (this.form.controls.email.invalid || this.form.controls.password.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const role = this.form.controls.role.value;
      await this.authFacade.loginWithEmailPassword(
        this.form.controls.email.value,
        this.form.controls.password.value,
        role,
      );
      await this.router.navigateByUrl(this.getLandingPath(role));
    } catch (error) {
      this.errorMessage.set(this.resolveErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  protected async register(): Promise<void> {
    if (
      this.form.controls.name.invalid ||
      this.form.controls.lastName.invalid ||
      this.form.controls.email.invalid ||
      this.form.controls.password.invalid
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authFacade.registerWithEmailPassword(
        this.form.controls.name.value,
        this.form.controls.lastName.value,
        this.form.controls.email.value,
        this.form.controls.password.value,
        this.form.controls.role.value,
      );
      this.mode.set('login');
      this.errorMessage.set('Cuenta demo creada. Ahora podés ingresar.');
    } catch (error) {
      this.errorMessage.set(this.resolveErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'No se pudo completar la operación. Revisá credenciales y configuración de Firebase.';
  }

  private getLandingPath(role: Role): string {
    switch (role) {
      case Role.ORG_OWNER:
        return '/org-owner/dashboard';
      case Role.ORG_ADMIN:
        return '/hq-admin/dashboard';
      default:
        return '/dashboard';
    }
  }
}
