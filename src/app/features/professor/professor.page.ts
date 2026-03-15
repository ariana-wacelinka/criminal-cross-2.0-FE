import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { UsersApi } from '../../core/api/users.api';
import { UserScopeService } from '../../core/auth';

@Component({
  selector: 'app-professor-page',
  imports: [RouterLink],
  templateUrl: './professor.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorPage {
  private readonly usersApi = inject(UsersApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly userScope = inject(UserScopeService);
  private readonly headquartersId = computed(() => this.userScope.defaultHeadquartersId());

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

  protected readonly usersCount = computed(() => this.usersPage()?.total ?? 0);
  protected readonly activitiesCount = computed(() => this.activitiesPage()?.totalElements ?? 0);

  private readonly activitiesPath = computed(() => {
    const headquartersId = this.headquartersId();
    return headquartersId ? `/headquarters/${headquartersId}/activities` : '/professor/dashboard';
  });

  protected readonly quickLinks = computed(
    () =>
      [
        {
          title: 'Usuarios',
          description: 'Ver y editar usuarios de la sede.',
          path: '/professor/users',
          icon: 'group',
        },
        {
          title: 'Actividades',
          description: 'Consultar actividades disponibles en la sede.',
          path: this.activitiesPath(),
          icon: 'fitness_center',
        },
        {
          title: 'Agenda',
          description: 'Revisar sesiones y participantes.',
          path: '/professor/agenda',
          icon: 'event_note',
        },
        {
          title: 'Horarios',
          description: 'Consultar grilla horaria de actividades.',
          path: '/professor/schedules',
          icon: 'schedule',
        },
      ] as const,
  );
}
