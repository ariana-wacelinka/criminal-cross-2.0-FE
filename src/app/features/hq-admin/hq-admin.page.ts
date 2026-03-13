import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { PaymentsApi } from '../../core/api/payments.api';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-hq-admin-page',
  imports: [RouterLink],
  templateUrl: './hq-admin.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HqAdminPage {
  private readonly usersApi = inject(UsersApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly paymentsApi = inject(PaymentsApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly accessibleHeadquarters = toSignal(this.headquartersApi.getAll(), {
    initialValue: [],
  });
  private readonly headquartersId = computed(() => this.accessibleHeadquarters()[0]?.id ?? null);

  protected readonly usersPage = toSignal(
    toObservable(this.headquartersId).pipe(
      switchMap((headquartersId) =>
        headquartersId
          ? this.usersApi.getUsersByHq(headquartersId, 0, 1)
          : of({ items: [], total: 0, page: 0, size: 1 }),
      ),
    ),
    { initialValue: null },
  );
  protected readonly activitiesPage = toSignal(
    toObservable(this.headquartersId).pipe(
      switchMap((headquartersId) =>
        headquartersId
          ? this.activitiesApi.getAll({ hqId: headquartersId, page: 0, size: 1 })
          : of({ content: [], page: 0, size: 1, totalElements: 0, totalPages: 0 }),
      ),
    ),
    { initialValue: null },
  );
  protected readonly paymentsPage = toSignal(
    toObservable(this.headquartersId).pipe(
      switchMap((headquartersId) =>
        headquartersId
          ? this.paymentsApi.getAllByHq(headquartersId, 0, 1)
          : of({ items: [], total: 0, page: 0, size: 1 }),
      ),
    ),
    { initialValue: null },
  );

  protected readonly usersCount = computed(() => this.usersPage()?.total ?? 0);
  protected readonly activitiesCount = computed(() => this.activitiesPage()?.totalElements ?? 0);
  protected readonly paymentsCount = computed(() => this.paymentsPage()?.total ?? 0);

  protected readonly quickLinks = [
    {
      title: 'Usuarios',
      description: 'Ver, editar o eliminar usuarios de la sede.',
      path: '/hq-admin/users',
      icon: 'group',
    },
    {
      title: 'Pagos',
      description: 'Registrar pagos y crear paquetes para clientes.',
      path: '/hq-admin/payments',
      icon: 'payments',
    },
    {
      title: 'Agenda',
      description: 'Revisar sesiones y participantes.',
      path: '/hq-admin/agenda',
      icon: 'event_note',
    },
    {
      title: 'Horarios',
      description: 'Configurar grilla horaria de actividades.',
      path: '/hq-admin/schedules',
      icon: 'schedule',
    },
  ] as const;
}
