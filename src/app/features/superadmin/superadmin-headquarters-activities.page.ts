import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { AuthSessionService } from '../../core/auth';
import { GymConfigApi } from '../../core/api/gym-config.api';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { Role } from '../../core/domain/models';

@Component({
  selector: 'app-superadmin-headquarters-activities-page',
  templateUrl: './superadmin-headquarters-activities.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminHeadquartersActivitiesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly authSession = inject(AuthSessionService);
  private readonly gymConfigApi = inject(GymConfigApi);
  private readonly headquartersApi = inject(HeadquartersApi);

  private readonly headquartersId = Number(this.route.snapshot.paramMap.get('headquartersId'));

  protected readonly pageSize = 20;
  protected readonly currentPage = signal(0);
  protected readonly searchQuery = signal('');
  protected readonly openActivityMenuId = signal<number | null>(null);

  private readonly activitiesRequest = computed(() => ({
    page: this.currentPage(),
    search: this.searchQuery().trim(),
  }));

  protected readonly headquarters = toSignal(this.headquartersApi.getById(this.headquartersId), {
    initialValue: null,
  });

  protected readonly activitiesPage = toSignal(
    toObservable(this.activitiesRequest).pipe(
      switchMap(({ page, search }) =>
        this.activitiesApi.getAll({
          hqId: this.headquartersId,
          name: search || undefined,
          page,
          size: this.pageSize,
        }),
      ),
    ),
    { initialValue: null },
  );

  private readonly activityCapacityMap = toSignal(
    toObservable(
      computed(() => ({
        organizationId: this.headquarters()?.organizationId ?? 0,
        activities: this.activities(),
      })),
    ).pipe(
      switchMap(({ organizationId, activities }) => {
        if (!organizationId || !activities.length) {
          return of<Record<number, number | null>>({});
        }

        return forkJoin(
          activities.map((activity) =>
            this.gymConfigApi
              .getEffective({
                organizationId,
                headquartersId: this.headquartersId,
                activityId: activity.id,
              })
              .pipe(
                map((config) => [activity.id, config.maxParticipants ?? null] as const),
                catchError(() => of([activity.id, null] as const)),
              ),
          ),
        ).pipe(map((entries) => Object.fromEntries(entries)));
      }),
    ),
    { initialValue: {} as Record<number, number | null> },
  );

  protected readonly isHeadquartersLoading = computed(() => this.headquarters() === null);
  protected readonly isLoading = computed(() => !this.activitiesPage());
  protected readonly activities = computed(() => this.activitiesPage()?.content ?? []);
  protected readonly hasItems = computed(() => this.activities().length > 0);
  protected readonly totalPages = computed(() => this.activitiesPage()?.totalPages ?? 1);
  protected readonly canGoPrev = computed(() => this.currentPage() > 0);
  protected readonly canGoNext = computed(() => this.currentPage() < this.totalPages() - 1);
  protected readonly pageLabel = computed(() => {
    const page = this.activitiesPage();
    if (!page || !page.totalElements) {
      return 'Sin resultados';
    }

    const start = page.page * page.size + 1;
    const end = Math.min((page.page + 1) * page.size, page.totalElements);
    return `${start}-${end} de ${page.totalElements}`;
  });

  private readonly headquartersListPath = computed(() => {
    const roles = this.authSession.user()?.roles ?? [];
    if (roles.includes(Role.SUPERADMIN)) {
      return '/headquarters';
    }
    if (roles.includes(Role.PROFESSOR)) {
      return '/professor/dashboard';
    }
    return '/org-owner/headquarters';
  });

  protected async goBack(): Promise<void> {
    await this.router.navigateByUrl(this.headquartersListPath());
  }

  protected async createActivity(): Promise<void> {
    await this.router.navigateByUrl(`/headquarters/${this.headquartersId}/activities/create`);
  }

  protected toggleActivityMenu(activityId: number): void {
    this.openActivityMenuId.update((current) => (current === activityId ? null : activityId));
  }

  protected async viewActivity(activityId: number): Promise<void> {
    this.openActivityMenuId.set(null);
    await this.router.navigateByUrl(
      `/headquarters/${this.headquartersId}/activities/${activityId}`,
    );
  }

  protected async editActivity(activityId: number): Promise<void> {
    this.openActivityMenuId.set(null);
    await this.router.navigateByUrl(
      `/headquarters/${this.headquartersId}/activities/${activityId}/edit`,
    );
  }

  protected async deleteActivity(activityId: number): Promise<void> {
    this.openActivityMenuId.set(null);
    await this.router.navigateByUrl(
      `/headquarters/${this.headquartersId}/activities/${activityId}/delete`,
    );
  }

  protected previousPage(): void {
    if (!this.canGoPrev()) {
      return;
    }
    this.currentPage.update((page) => page - 1);
    this.openActivityMenuId.set(null);
  }

  protected nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }
    this.currentPage.update((page) => page + 1);
    this.openActivityMenuId.set(null);
  }

  protected setSearchQuery(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(0);
    this.openActivityMenuId.set(null);
  }

  protected activityCapacity(activityId: number): string {
    const capacity = this.activityCapacityMap()[activityId];
    return capacity == null ? '-' : String(capacity);
  }
}
