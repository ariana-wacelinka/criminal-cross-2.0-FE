import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { BookingsApi } from '../../core/api/bookings.api';
import { SessionsApi } from '../../core/api/sessions.api';
import { AuthSessionService } from '../../core/auth';
import { ClientContextService } from '../../core/client-context/client-context.service';
import { BookingStatus } from '../../core/domain/models';

interface HistoryItem {
  bookingId: number;
  activityName: string;
  dateLabel: string;
  scheduleLabel: string;
}

@Component({
  selector: 'app-client-history-page',
  templateUrl: './client-history.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientHistoryPage {
  private readonly authSession = inject(AuthSessionService);
  private readonly bookingsApi = inject(BookingsApi);
  private readonly sessionsApi = inject(SessionsApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly clientContext = inject(ClientContextService);

  private readonly userId = this.authSession.user()?.userId ?? null;
  private readonly headquartersId = this.clientContext.current()?.headquartersId ?? 101;
  protected readonly historyUnavailable = signal(false);

  private readonly bookings = toSignal(
    this.bookingsApi
      .getAll({
        userId: this.userId ?? undefined,
        page: 0,
        limit: 100,
        sort: 'createdAt:desc',
      })
      .pipe(
        catchError(() => {
          this.historyUnavailable.set(true);
          return of({ items: [] });
        }),
      )
      .pipe(map((response) => response.items)),
    { initialValue: null },
  );

  private readonly activitiesCatalog = toSignal(
    this.activitiesApi
      .getAll({ hqId: this.headquartersId, page: 0, size: 200 })
      .pipe(map((response) => response.content)),
    { initialValue: null },
  );

  private readonly sessionsById = toSignal(
    toObservable(this.bookings).pipe(
      switchMap((bookings) => {
        if (bookings === null) {
          return of(
            null as Map<
              number,
              { startsAt: string; endsAt: string; activityId: number; activityName?: string }
            > | null,
          );
        }

        const source = bookings ?? [];
        const uniqueSessionIds = [...new Set(source.map((booking) => booking.sessionId))];
        if (!uniqueSessionIds.length) {
          return of(
            new Map<
              number,
              { startsAt: string; endsAt: string; activityId: number; activityName?: string }
            >(),
          );
        }

        return forkJoin(uniqueSessionIds.map((id) => this.sessionsApi.getById(id))).pipe(
          map(
            (sessions) =>
              new Map(
                sessions.map((session) => [
                  session.id,
                  {
                    startsAt: session.startsAt,
                    endsAt: session.endsAt,
                    activityId: session.activityId,
                    activityName: session.activityName,
                  },
                ]),
              ),
          ),
          startWith(
            null as Map<
              number,
              { startsAt: string; endsAt: string; activityId: number; activityName?: string }
            > | null,
          ),
        );
      }),
    ),
    { initialValue: null },
  );

  protected readonly isLoading = computed(
    () =>
      this.bookings() === null || this.activitiesCatalog() === null || this.sessionsById() === null,
  );

  protected readonly history = computed<HistoryItem[]>(() => {
    const bookings = this.bookings() ?? [];
    const activities = this.activitiesCatalog() ?? [];
    const sessionsById = this.sessionsById() ?? new Map();

    const activityMap = new Map(activities.map((activity) => [activity.id, activity.name]));

    return bookings
      .filter((booking) => booking.status !== BookingStatus.CANCELLED)
      .map((booking) => {
        const session = sessionsById.get(booking.sessionId);
        if (!session) {
          return null;
        }

        const startsAt = session?.startsAt ?? booking.createdAt;
        const endsAt = session?.endsAt ?? booking.updatedAt;
        const activityName =
          session?.activityName ??
          (session ? activityMap.get(session.activityId) : null) ??
          `Actividad #${session?.activityId ?? '-'}`;

        return {
          bookingId: booking.id,
          activityName,
          dateLabel: new Date(startsAt).toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          scheduleLabel: `${this.hourLabel(new Date(startsAt))} - ${this.hourLabel(new Date(endsAt))}`,
        };
      })
      .filter((item): item is HistoryItem => item !== null);
  });

  private hourLabel(date: Date): string {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
