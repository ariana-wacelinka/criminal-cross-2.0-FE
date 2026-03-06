import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { BookingsApi } from '../../core/api/bookings.api';
import { SessionsApi } from '../../core/api/sessions.api';
import { AuthSessionService } from '../../core/auth';
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

  private readonly userId = this.authSession.user()?.userId ?? 10;
  private readonly headquartersId = 101;

  private readonly bookings = toSignal(
    this.bookingsApi
      .getAll({
        userId: this.userId,
        status: BookingStatus.ATTENDED,
        page: 0,
        limit: 100,
        sort: 'createdAt:desc',
      })
      .pipe(map((response) => response.items)),
    { initialValue: [] },
  );

  private readonly activitiesCatalog = toSignal(
    this.activitiesApi
      .getAll({ hqId: this.headquartersId, page: 0, size: 200 })
      .pipe(map((response) => response.content)),
    { initialValue: [] },
  );

  private readonly sessionsById = toSignal(
    toObservable(this.bookings).pipe(
      switchMap((bookings) => {
        const uniqueSessionIds = [...new Set(bookings.map((booking) => booking.sessionId))];
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
        );
      }),
    ),
    {
      initialValue: new Map<
        number,
        { startsAt: string; endsAt: string; activityId: number; activityName?: string }
      >(),
    },
  );

  protected readonly history = computed<HistoryItem[]>(() => {
    const activityMap = new Map(
      this.activitiesCatalog().map((activity) => [activity.id, activity.name]),
    );

    return this.bookings().map((booking) => {
      const session = this.sessionsById().get(booking.sessionId);
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
    });
  });

  private hourLabel(date: Date): string {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
