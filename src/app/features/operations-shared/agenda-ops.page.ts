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
import { map, of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { SessionsApi } from '../../core/api/sessions.api';
import { UserScopeService } from '../../core/auth';
import { SessionInstance, SessionStatus } from '../../core/domain/models';

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
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly userScope = inject(UserScopeService);

  protected readonly scope = this.route.snapshot.data['scope'] as 'org' | 'hq';
  private readonly pageSize = 20;

  private readonly accessibleHeadquarters = computed(() => this.userScope.headquarters());
  private readonly defaultHeadquartersId = computed(
    () => this.accessibleHeadquarters()[0]?.id ?? 0,
  );
  private readonly organizationId = computed(() => this.userScope.organizationId() ?? 0);

  protected readonly title = this.scope === 'org' ? 'Agenda por sede' : 'Agenda';
  protected readonly currentPage = signal(0);
  protected readonly selectedSessionId = signal<number | null>(null);
  protected readonly selectedHeadquartersId = signal(
    this.scope === 'hq' ? this.defaultHeadquartersId() : 0,
  );

  protected readonly headquarters = computed(() => this.accessibleHeadquarters());

  protected readonly sessionsPage = toSignal(
    toObservable(
      computed(() => ({
        page: this.currentPage(),
        headquartersId: this.selectedHeadquartersId(),
      })),
    ).pipe(
      switchMap(({ page, headquartersId }) => {
        if (!headquartersId) {
          return of(null);
        }

        return this.sessionsApi.getAll({
          organizationId: this.organizationId() || undefined,
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
          return of(null);
        }
        return this.activitiesApi
          .getAll({ hqId: headquartersId, page: 0, size: 100 })
          .pipe(map((response) => response.content));
      }),
    ),
    { initialValue: null },
  );

  protected readonly sessions = computed(() => this.sessionsPage()?.items ?? []);
  protected readonly hasItems = computed(() => this.sessions().length > 0);
  protected readonly isLoading = computed(
    () =>
      !this.selectedHeadquartersId() ||
      this.sessionsPage() === null ||
      this.activitiesCatalog() === null,
  );
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
    const session = this.selectedSession();
    return (session?.participants ?? []).map((participant) => ({
      id: participant.id,
      name: `${participant.name}${participant.lastName ? ` ${participant.lastName}` : ''}`.trim(),
      email: participant.email?.trim() || 'Sin email',
    }));
  });

  constructor() {
    effect(() => {
      const headquarters = this.headquarters();
      if (this.scope === 'hq' && headquarters.length && !this.selectedHeadquartersId()) {
        this.selectedHeadquartersId.set(headquarters[0].id);
        return;
      }

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
      this.activitiesCatalog()?.find((activity) => activity.id === activityId)?.name ??
      `Actividad #${activityId}`
    );
  }

  protected occupancy(sessionId: number): number {
    return this.sessions().find((session) => session.id === sessionId)?.participants?.length ?? 0;
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
