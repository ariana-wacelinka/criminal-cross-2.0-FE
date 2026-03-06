import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { BookingsApi } from '../../core/api/bookings.api';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { SessionsApi } from '../../core/api/sessions.api';
import { UsersApi } from '../../core/api/users.api';
import { BookingStatus, SessionInstance, SessionStatus } from '../../core/domain/models';

interface AgendaParticipant {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-agenda-ops-page',
  imports: [DatePipe],
  templateUrl: './agenda-ops.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaOpsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionsApi = inject(SessionsApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly bookingsApi = inject(BookingsApi);
  private readonly usersApi = inject(UsersApi);

  protected readonly scope = this.route.snapshot.data['scope'] as 'org' | 'hq';
  private readonly organizationId = 1;
  private readonly headquartersId = 101;
  private readonly pageSize = 20;

  protected readonly title = this.scope === 'org' ? 'Agenda por sede' : 'Agenda';
  protected readonly currentPage = signal(0);
  protected readonly selectedSessionId = signal<number | null>(null);
  protected readonly selectedHeadquartersId = signal(this.scope === 'hq' ? this.headquartersId : 0);

  protected readonly headquartersPage = toSignal(
    this.scope === 'org'
      ? this.headquartersApi.getPage(0, 100, this.organizationId)
      : this.headquartersApi.getPage(0, 1, this.organizationId),
    { initialValue: null },
  );

  protected readonly sessionsPage = toSignal(
    toObservable(
      computed(() => ({
        page: this.currentPage(),
        headquartersId: this.selectedHeadquartersId(),
      })),
    ).pipe(
      switchMap(({ page, headquartersId }) => {
        if (!headquartersId) {
          return of({ items: [], page, limit: this.pageSize, total: 0 });
        }

        return this.sessionsApi.getAll({
          organizationId: this.organizationId,
          headquartersId,
          page,
          limit: this.pageSize,
          sort: 'startsAt:asc',
        });
      }),
    ),
    { initialValue: null },
  );

  protected readonly activitiesCatalog = toSignal(
    toObservable(this.selectedHeadquartersId).pipe(
      switchMap((headquartersId) => {
        if (!headquartersId) {
          return of([]);
        }
        return this.activitiesApi
          .getAll({ hqId: headquartersId, page: 0, size: 100 })
          .pipe(map((response) => response.content));
      }),
    ),
    { initialValue: [] },
  );

  private readonly usersCatalog = toSignal(this.usersApi.getAll(), { initialValue: [] });

  private readonly sessionOccupancyMap = toSignal(
    toObservable(computed(() => this.sessionsPage()?.items ?? [])).pipe(
      switchMap((sessions) => {
        if (!sessions.length) {
          return of<Record<number, number>>({});
        }

        return forkJoin(
          sessions.map((session) =>
            this.bookingsApi.getAll({ sessionId: session.id, page: 0, limit: 200 }).pipe(
              map((response) => {
                const count = response.items.filter(
                  (booking) => booking.status !== BookingStatus.CANCELLED,
                ).length;
                return [session.id, count] as const;
              }),
            ),
          ),
        ).pipe(map((entries) => Object.fromEntries(entries)));
      }),
    ),
    { initialValue: {} as Record<number, number> },
  );

  private readonly sessionBookings = toSignal(
    toObservable(this.selectedSessionId).pipe(
      switchMap((sessionId) => {
        if (!sessionId) {
          return of([]);
        }

        return this.bookingsApi
          .getAll({ sessionId, page: 0, limit: 100 })
          .pipe(map((response) => response.items));
      }),
    ),
    { initialValue: [] },
  );

  protected readonly sessions = computed(() => this.sessionsPage()?.items ?? []);
  protected readonly hasItems = computed(() => this.sessions().length > 0);
  protected readonly isLoading = computed(() => !this.sessionsPage());
  protected readonly canGoPrev = computed(() => this.currentPage() > 0);
  protected readonly canGoNext = computed(() => {
    const page = this.sessionsPage();
    if (!page) {
      return false;
    }
    return this.currentPage() < Math.ceil(page.total / Math.max(1, page.limit)) - 1;
  });

  protected readonly selectedSession = computed(() => {
    const sessionId = this.selectedSessionId();
    if (!sessionId) {
      return null;
    }
    return this.sessions().find((item) => item.id === sessionId) ?? null;
  });

  protected readonly selectedParticipants = computed<AgendaParticipant[]>(() => {
    const users = this.usersCatalog();
    return this.sessionBookings()
      .filter((booking) => booking.status !== BookingStatus.CANCELLED)
      .map((booking) => {
        const user = users.find((item) => item.id === booking.userId);
        return {
          id: booking.id,
          name: user ? `${user.name} ${user.lastName}` : `Usuario #${booking.userId}`,
          email: user?.email ?? `user${booking.userId}@athlium.app`,
        };
      });
  });

  constructor() {
    effect(() => {
      const headquarters = this.headquartersPage()?.items ?? [];
      if (this.scope === 'org' && headquarters.length && !this.selectedHeadquartersId()) {
        this.selectedHeadquartersId.set(headquarters[0].id);
      }
    });

    effect(() => {
      const selectedSessionId = this.selectedSessionId();
      if (!selectedSessionId) {
        return;
      }
      const stillVisible = this.sessions().some((session) => session.id === selectedSessionId);
      if (!stillVisible) {
        this.selectedSessionId.set(null);
      }
    });
  }

  protected onHeadquartersChange(value: string): void {
    this.selectedHeadquartersId.set(Number(value));
    this.currentPage.set(0);
    this.selectedSessionId.set(null);
  }

  protected previousPage(): void {
    if (this.canGoPrev()) {
      this.currentPage.update((value) => value - 1);
    }
  }

  protected nextPage(): void {
    if (this.canGoNext()) {
      this.currentPage.update((value) => value + 1);
    }
  }

  protected openSessionDetail(sessionId: number): void {
    this.selectedSessionId.set(sessionId);
  }

  protected closeSessionDetail(): void {
    this.selectedSessionId.set(null);
  }

  protected activityName(activityId: number, activityName?: string | null): string {
    if (activityName?.trim()) {
      return activityName;
    }

    return (
      this.activitiesCatalog().find((activity) => activity.id === activityId)?.name ??
      `Actividad #${activityId}`
    );
  }

  protected occupancy(sessionId: number): number {
    return this.sessionOccupancyMap()[sessionId] ?? 0;
  }

  protected dateLabel(isoInstant: string): string {
    return new Date(isoInstant).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  protected scheduleLabel(session: SessionInstance): string {
    const startsAt = new Date(session.startsAt);
    const endsAt = this.endByDuration(session);

    return `${this.hourLabel(startsAt)} - ${this.hourLabel(endsAt)}`;
  }

  protected sessionEndLabel(session: SessionInstance): string {
    return this.hourLabel(this.endByDuration(session));
  }

  protected statusLabel(status: SessionStatus): string {
    switch (status) {
      case SessionStatus.OPEN:
        return 'Abierta';
      case SessionStatus.CLOSED:
        return 'Cerrada';
      case SessionStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  }

  protected initials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private hourLabel(date: Date): string {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private endByDuration(session: SessionInstance): Date {
    const startsAt = new Date(session.startsAt);
    const durationMinutes = Math.max(
      0,
      Math.round((new Date(session.endsAt).getTime() - startsAt.getTime()) / 60000),
    );
    return new Date(startsAt.getTime() + durationMinutes * 60000);
  }
}
