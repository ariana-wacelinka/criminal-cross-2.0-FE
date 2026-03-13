import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UpdateRolesRequest, UpdateUserRequest, UsersApi } from '../../core/api/users.api';
import { AuthSessionService } from '../../core/auth';
import { Role } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-superadmin-user-edit-page',
  imports: [ReactiveFormsModule],
  templateUrl: './superadmin-user-edit.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUserEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  private readonly authSession = inject(AuthSessionService);
  private readonly toast = inject(UiToastService);

  private readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  protected readonly currentEditorRole = computed(
    () => this.authSession.user()?.roles[0] ?? Role.ORG_ADMIN,
  );
  protected readonly canEditRoles = computed(() => this.currentEditorRole() !== Role.PROFESSOR);
  protected readonly availableRoles = computed(() => {
    switch (this.currentEditorRole()) {
      case Role.SUPERADMIN:
        return [Role.CLIENT, Role.PROFESSOR, Role.ORG_ADMIN, Role.ORG_OWNER, Role.SUPERADMIN];
      case Role.ORG_OWNER:
        return [Role.CLIENT, Role.PROFESSOR, Role.ORG_ADMIN];
      case Role.ORG_ADMIN:
        return [Role.CLIENT, Role.PROFESSOR];
      default:
        return [] as Role[];
    }
  });
  protected readonly allowedRoleSet = computed(() => new Set(this.availableRoles()));

  protected readonly user = toSignal(this.usersApi.getById(this.userId), {
    initialValue: null,
  });

  protected readonly selectedRoles = signal<Role[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly isLoading = computed(() => this.user() === null);
  protected readonly fullName = computed(() => {
    const user = this.user();
    return user ? `${user.name} ${user.lastName}`.trim() : 'Cargando usuario';
  });

  constructor() {
    let initialized = false;
    effect(() => {
      const currentUser = this.user();
      if (!currentUser) {
        return;
      }

      if (!initialized && currentUser.id === this.userId) {
        this.form.patchValue(
          {
            name: currentUser.name,
            lastName: currentUser.lastName,
            email: currentUser.email,
          },
          { emitEvent: false },
        );
        const allowed = new Set(this.availableRoles());
        this.selectedRoles.set(currentUser.roles.filter((role) => allowed.has(role)));
        initialized = true;
      }
    });
  }

  protected toggleRole(role: Role): void {
    this.selectedRoles.update((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  protected isRoleSelected(role: Role): boolean {
    return this.selectedRoles().includes(role);
  }

  protected async save(): Promise<void> {
    if (this.isLoading() || this.isSaving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa todos los campos requeridos.');
      return;
    }

    if (this.canEditRoles() && !this.selectedRoles().length) {
      this.errorMessage.set('Debes seleccionar al menos un rol.');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    const user = this.user();
    if (!user) {
      this.errorMessage.set('No se pudo cargar el usuario.');
      this.isSaving.set(false);
      return;
    }

    const userPayload: UpdateUserRequest = {
      name: this.form.controls.name.value,
      lastName: this.form.controls.lastName.value,
      email: this.form.controls.email.value,
      active: user.active,
    };

    const sanitizedRoles = this.selectedRoles().filter((role) => this.allowedRoleSet().has(role));

    if (this.canEditRoles() && sanitizedRoles.length !== this.selectedRoles().length) {
      this.errorMessage.set('Se detectaron roles no permitidos para tu perfil.');
      return;
    }

    const rolesPayload: UpdateRolesRequest = {
      roles: sanitizedRoles,
    };

    try {
      await firstValueFrom(this.usersApi.update(this.userId, userPayload));

      if (this.canEditRoles()) {
        await firstValueFrom(this.usersApi.updateRolesById(this.userId, rolesPayload));
      }
      this.toast.success('Usuario actualizado.');
      await this.router.navigateByUrl('/users');
    } catch {
      this.errorMessage.set('No se pudieron guardar los cambios.');
      this.toast.error('No se pudo actualizar el usuario.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/users');
  }
}
