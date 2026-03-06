import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin, map, of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { BookingsApi } from '../../core/api/bookings.api';
import { SessionsApi } from '../../core/api/sessions.api';
import { UsersApi } from '../../core/api/users.api';
import { AuthSessionService } from '../../core/auth';
import { BookingStatus, SessionInstance } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

interface ClientSessionRow {
  sessionId: number;
  activityName: string;
  dateLabel: string;
  scheduleLabel: string;
  occupancyLabel: string;
  booked: boolean;
}

interface SessionParticipantView {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-client-classes-page',
  templateUrl: './client-classes.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientClassesPage {
  private readonly authSession = inject(AuthSessionService);
  private readonly sessionsApi = inject(SessionsApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly bookingsApi = inject(BookingsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly toast = inject(UiToastService);

  private readonly userId = this.authSession.user()?.userId ?? 10;
  private readonly headquartersId = 101;

  protected readonly selectedDate = signal('');
  protected readonly selectedSessionId = signal<number | null>(null);
  private readonly bookingReloadTick = signal(0);

  protected readonly sessionsPage = toSignal(
    this.sessionsApi.getAll({
      headquartersId: this.headquartersId,
      page: 0,
      limit: 100,
      sort: 'startsAt:asc',
    }),
    { initialValue: null },
  );

  protected readonly activitiesCatalog = toSignal(
    this.activitiesApi
      .getAll({
        hqId: this.headquartersId,
        page: 0,
        size: 100,
      })
      .pipe(map((response) => response.content)),
    { initialValue: [] },
  );

  protected readonly userBookings = toSignal(
    toObservable(this.bookingReloadTick).pipe(
      switchMap(() =>
        this.bookingsApi
          .getAll({ userId: this.userId, page: 0, limit: 200, sort: 'createdAt:desc' })
          .pipe(map((response) => response.items)),
      ),
    ),
    { initialValue: [] },
  );

  private readonly sessionOccupancyMap = toSignal(
    toObservable(
      computed(() => ({
        sessions: this.sessionsPage()?.items ?? [],
        reload: this.bookingReloadTick(),
      })),
    ).pipe(
      switchMap(({ sessions }) => {
        if (!sessions.length) {
          return of<Record<number, number>>({});
        }

        return forkJoin(
          sessions.map((session) =>
            this.bookingsApi.getAll({ sessionId: session.id, page: 0, limit: 200 }).pipe(
              map((response) => {
                const occupied = response.items.filter(
                  (booking) => booking.status !== BookingStatus.CANCELLED,
                ).length;
                return [session.id, occupied] as const;
              }),
            ),
          ),
        ).pipe(map((entries) => Object.fromEntries(entries)));
      }),
    ),
    { initialValue: {} as Record<number, number> },
  );

  protected readonly selectedSessionBookings = toSignal(
    toObservable(
      computed(() => ({
        sessionId: this.selectedSessionId(),
        reload: this.bookingReloadTick(),
      })),
    ).pipe(
      switchMap(({ sessionId }) => {
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

  private readonly usersCatalog = toSignal(this.usersApi.getAll(), { initialValue: [] });

  private readonly bookingsBySession = computed(() => {
    const mapBySession = new Map<number, number>();
    for (const booking of this.userBookings()) {
      if (booking.status === BookingStatus.CANCELLED) {
        continue;
      }
      if (!mapBySession.has(booking.sessionId)) {
        mapBySession.set(booking.sessionId, booking.id);
      }
    }
    return mapBySession;
  });

  protected readonly sessions = computed(() => this.sessionsPage()?.items ?? []);

  protected readonly calendarDays = computed(() => {
    const dateSet = new Set(this.sessions().map((session) => this.toDateKey(session.startsAt)));
    return [...dateSet].sort();
  });

  protected readonly visibleRows = computed<ClientSessionRow[]>(() => {
    const selectedDate = this.selectedDate();
    const sessions = this.sessions().filter((session) =>
      selectedDate ? this.toDateKey(session.startsAt) === selectedDate : true,
    );

    return sessions.map((session) => ({
      sessionId: session.id,
      activityName: this.activityName(session.activityId, session.activityName),
      dateLabel: this.dateLabel(session.startsAt),
      scheduleLabel: this.scheduleLabel(session),
      occupancyLabel: `${this.occupancy(session.id)} / ${session.maxParticipants}`,
      booked: this.bookingsBySession().has(session.id),
    }));
  });

  protected readonly selectedSession = computed(() => {
    const selectedId = this.selectedSessionId();
    if (!selectedId) {
      return null;
    }
    return this.sessions().find((session) => session.id === selectedId) ?? null;
  });

  protected readonly selectedSessionBooked = computed(() => {
    const session = this.selectedSession();
    return session ? this.bookingsBySession().has(session.id) : false;
  });

  protected readonly selectedSessionOccupancy = computed(() => {
    const session = this.selectedSession();
    if (!session) {
      return 0;
    }
    return this.occupancy(session.id);
  });

  protected readonly selectedSessionParticipants = computed(() =>
    this.selectedSessionBookings()
      .filter((booking) => booking.status !== BookingStatus.CANCELLED)
      .map((booking) => {
        const user = this.usersCatalog().find((item) => item.id === booking.userId);
        return {
          id: booking.id,
          name: user ? `${user.name} ${user.lastName}` : `Usuario #${booking.userId}`,
          email: user?.email ?? `user${booking.userId}@athlium.app`,
        } as SessionParticipantView;
      }),
  );

  constructor() {
    effect(() => {
      const current = this.selectedDate();
      const days = this.calendarDays();
      if (!current && days.length) {
        this.selectedDate.set(days[0]);
      }
    });
  }

  protected setDate(value: string): void {
    this.selectedDate.set(value);
    this.selectedSessionId.set(null);
  }

  protected openSession(sessionId: number): void {
    this.selectedSessionId.set(sessionId);
  }

  protected closeSession(): void {
    this.selectedSessionId.set(null);
  }

  protected async reserveSession(sessionId: number): Promise<void> {
    if (this.bookingsBySession().has(sessionId)) {
      return;
    }

    try {
      await firstValueFrom(this.bookingsApi.create(sessionId, this.userId));
      this.bookingReloadTick.update((value) => value + 1);
      this.toast.success('Reserva confirmada.');
    } catch {
      this.toast.error('No se pudo reservar la sesión.');
    }
  }

  protected async cancelReservation(sessionId: number): Promise<void> {
    const activeBookingIds = this.userBookings()
      .filter(
        (booking) => booking.sessionId === sessionId && booking.status !== BookingStatus.CANCELLED,
      )
      .map((booking) => booking.id);

    if (!activeBookingIds.length) {
      return;
    }

    try {
      await Promise.all(
        activeBookingIds.map((bookingId) => firstValueFrom(this.bookingsApi.cancel(bookingId))),
      );
      this.bookingReloadTick.update((value) => value + 1);
      this.toast.success('Reserva cancelada.');
    } catch {
      this.toast.error('No se pudo cancelar la reserva.');
    }
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
    const endsAt = new Date(session.endsAt);
    return `${this.hourLabel(startsAt)} - ${this.hourLabel(endsAt)}`;
  }

  protected occupancy(sessionId: number): number {
    return this.sessionOccupancyMap()[sessionId] ?? 0;
  }

  private toDateKey(isoInstant: string): string {
    return new Date(isoInstant).toISOString().slice(0, 10);
  }

  private hourLabel(date: Date): string {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
