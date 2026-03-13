import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { BookingsApi } from '../../core/api/bookings.api';
import { SessionsApi } from '../../core/api/sessions.api';
import { AuthSessionService } from '../../core/auth';
import { ClientContextService } from '../../core/client-context/client-context.service';
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
  private readonly clientContext = inject(ClientContextService);
  private readonly toast = inject(UiToastService);

  private readonly currentUserId = this.authSession.user()?.userId ?? null;
  private readonly currentUserEmail = this.authSession.user()?.email?.toLowerCase().trim() ?? null;
  private readonly headquartersId = this.clientContext.current()?.headquartersId ?? 101;

  protected readonly selectedDate = signal('');
  protected readonly selectedSessionId = signal<number | null>(null);
  private readonly localBookingsBySession = signal<Record<number, number>>({});
  private readonly sessionsReloadTick = signal(0);

  protected readonly sessionsPage = toSignal(
    toObservable(this.sessionsReloadTick).pipe(
      switchMap(() =>
        this.sessionsApi.getAll({
          headquartersId: this.headquartersId,
          page: 0,
          limit: 100,
          sort: 'startsAt:asc',
        }),
      ),
    ),
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
    { initialValue: null },
  );

  private readonly bookingsBySession = computed(() => {
    const entries = Object.entries(this.localBookingsBySession()).map(
      ([sessionId, bookingId]) => [Number(sessionId), bookingId] as const,
    );
    return new Map<number, number>(entries);
  });

  protected readonly sessions = computed(() => this.sessionsPage()?.items ?? []);
  protected readonly isLoading = computed(
    () => this.sessionsPage() === null || this.activitiesCatalog() === null,
  );

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
      occupancyLabel: `${session.participants?.length ?? 0} / ${session.maxParticipants}`,
      booked: this.isSessionBooked(session),
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
    return session ? this.isSessionBooked(session) : false;
  });

  protected readonly selectedSessionOccupancy = computed(() => {
    const session = this.selectedSession();
    if (!session) {
      return 0;
    }
    return session.participants?.length ?? 0;
  });

  protected readonly selectedSessionParticipants = computed<SessionParticipantView[]>(() => {
    const session = this.selectedSession();
    if (!session?.participants?.length) {
      return [];
    }

    return session.participants.map((participant) => ({
      id: participant.id,
      name: `${participant.name}${participant.lastName ? ` ${participant.lastName}` : ''}`.trim(),
      email: participant.email?.trim() || 'Sin email',
    }));
  });

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
      const booking = await firstValueFrom(this.bookingsApi.create(sessionId));
      this.localBookingsBySession.update((current) => ({ ...current, [sessionId]: booking.id }));
      this.sessionsReloadTick.update((value) => value + 1);
      this.toast.success('Reserva confirmada.');
    } catch (error) {
      this.toast.error(this.resolveBookingError(error, 'No se pudo reservar la sesión.'));
    }
  }

  protected async cancelReservation(sessionId: number): Promise<void> {
    let bookingId: number | undefined = this.bookingsBySession().get(sessionId);
    if (bookingId == null) {
      bookingId = (await this.findOwnBookingId(sessionId)) ?? undefined;
    }

    if (bookingId == null) {
      this.toast.show('No se encontro una reserva activa para cancelar.', 'info');
      return;
    }

    try {
      await firstValueFrom(this.bookingsApi.cancel(bookingId));
      this.localBookingsBySession.update((current) => {
        const next = { ...current };
        delete next[sessionId];
        return next;
      });
      this.sessionsReloadTick.update((value) => value + 1);
      this.toast.success('Reserva cancelada.');
    } catch (error) {
      this.toast.error(this.resolveBookingError(error, 'No se pudo cancelar la reserva.'));
    }
  }

  private resolveBookingError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }

  private isSessionBooked(session: SessionInstance): boolean {
    if (this.bookingsBySession().has(session.id)) {
      return true;
    }

    const participants = session.participants ?? [];
    if (!participants.length) {
      return false;
    }

    return participants.some((participant) => {
      const matchesId = this.currentUserId !== null && participant.id === this.currentUserId;
      const matchesEmail =
        !!this.currentUserEmail &&
        participant.email?.toLowerCase().trim() === this.currentUserEmail;
      return matchesId || matchesEmail;
    });
  }

  private async findOwnBookingId(sessionId: number): Promise<number | null> {
    try {
      const page = await firstValueFrom(this.bookingsApi.getAll({ sessionId, page: 0, limit: 50 }));
      const booking = page.items.find((item) =>
        [BookingStatus.CONFIRMED, BookingStatus.WAITLISTED].includes(item.status),
      );
      return booking?.id ?? null;
    } catch {
      return null;
    }
  }

  protected activityName(activityId: number, activityName?: string | null): string {
    if (activityName?.trim()) {
      return activityName;
    }

    return (
      this.activitiesCatalog()?.find((activity) => activity.id === activityId)?.name ??
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
