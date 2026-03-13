import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Role } from '../../core/domain/models';
import { AuthFacadeService, AuthSessionService } from '../../core/auth';
import { ClientContextService } from '../../core/client-context/client-context.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authFacade = inject(AuthFacadeService);
  private readonly authSession = inject(AuthSessionService);
  private readonly clientContext = inject(ClientContextService);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly feedbackTone = signal<'error' | 'success'>('error');
  protected readonly loading = signal(false);
  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly showPassword = signal(false);

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
  });

  protected setMode(nextMode: 'login' | 'register'): void {
    this.mode.set(nextMode);
    this.errorMessage.set(null);
    this.feedbackTone.set('error');
  }

  protected async submit(): Promise<void> {
    if (this.mode() === 'register') {
      await this.register();
      return;
    }

    await this.login();
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((current) => !current);
  }

  protected async login(): Promise<void> {
    if (this.form.controls.email.invalid || this.form.controls.password.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.feedbackTone.set('error');

    try {
      await this.authFacade.loginWithEmailPassword(
        this.form.controls.email.value,
        this.form.controls.password.value,
      );
      await this.router.navigateByUrl(this.getLandingPath(this.authSession.user()?.roles[0]));
    } catch (error) {
      this.feedbackTone.set('error');
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
    this.feedbackTone.set('error');

    try {
      await this.authFacade.registerWithEmailPassword(
        this.form.controls.name.value,
        this.form.controls.lastName.value,
        this.form.controls.email.value,
        this.form.controls.password.value,
      );
      this.mode.set('login');
      this.feedbackTone.set('success');
      this.errorMessage.set('Cuenta creada con exito. Ya podes ingresar.');
    } catch (error) {
      this.feedbackTone.set('error');
      this.errorMessage.set(this.resolveErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }
      return 'No se pudo completar la operación. Revisá tus credenciales.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'No se pudo completar la operación. Revisá credenciales y configuración de Firebase.';
  }

  private getLandingPath(role: Role | undefined): string {
    switch (role) {
      case Role.ORG_OWNER:
        return '/org-owner/dashboard';
      case Role.ORG_ADMIN:
        return '/hq-admin/dashboard';
      case Role.PROFESSOR:
        return '/professor/dashboard';
      case Role.CLIENT:
        return this.clientContext.isComplete() ? '/client/dashboard' : '/client/pre-onboarding';
      default:
        return '/dashboard';
    }
  }
}
