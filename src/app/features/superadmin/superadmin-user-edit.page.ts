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
import { Role } from '../../core/domain/models';

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

  private readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  protected readonly availableRoles = [
    Role.CLIENT,
    Role.PROFESSOR,
    Role.ORG_ADMIN,
    Role.ORG_OWNER,
    Role.SUPERADMIN,
  ];

  protected readonly user = toSignal(this.usersApi.getById(this.userId), {
    initialValue: {
      id: this.userId,
      name: 'Cargando',
      lastName: 'usuario',
      email: '',
      firebaseUid: '',
      roles: [],
      active: true,
    },
  });

  protected readonly selectedRoles = signal<Role[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly fullName = computed(() =>
    `${this.user().name} ${this.user().lastName}`.trim(),
  );

  constructor() {
    let initialized = false;
    effect(() => {
      const currentUser = this.user();
      if (!initialized && currentUser.id === this.userId) {
        this.form.patchValue(
          {
            name: currentUser.name,
            lastName: currentUser.lastName,
            email: currentUser.email,
          },
          { emitEvent: false },
        );
        this.selectedRoles.set([...currentUser.roles]);
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa todos los campos requeridos.');
      return;
    }

    if (!this.selectedRoles().length) {
      this.errorMessage.set('Debes seleccionar al menos un rol.');
      return;
    }

    this.errorMessage.set(null);

    const userPayload: UpdateUserRequest = {
      name: this.form.controls.name.value,
      lastName: this.form.controls.lastName.value,
      email: this.form.controls.email.value,
    };

    const rolesPayload: UpdateRolesRequest = {
      roles: this.selectedRoles(),
    };

    await firstValueFrom(this.usersApi.update(this.userId, userPayload));
    await firstValueFrom(this.usersApi.updateRoles(this.userId, rolesPayload));
    await this.router.navigateByUrl('/users');
  }

  protected async cancel(): Promise<void> {
    await this.router.navigateByUrl('/users');
  }
}
