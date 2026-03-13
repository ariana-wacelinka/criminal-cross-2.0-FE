import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivitiesApi } from '../../core/api/activities.api';
import { ClientPackagesApi } from '../../core/api/client-packages.api';
import { AuthSessionService } from '../../core/auth';
import { ClientContextService } from '../../core/client-context/client-context.service';
import { ClientPackage } from '../../core/domain/models';

@Component({
  selector: 'app-client-packages-page',
  templateUrl: './client-packages.page.html',
  styles: [
    `
      :host {
        display: block;
      }

      .package-header {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .package-title {
        font-size: 0.95rem;
        line-height: 1.35;
        text-wrap: pretty;
        overflow-wrap: anywhere;
      }

      .package-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-weight: 600;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPackagesPage {
  private readonly authSession = inject(AuthSessionService);
  private readonly clientPackagesApi = inject(ClientPackagesApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly clientContext = inject(ClientContextService);
  private readonly userId = this.authSession.user()?.userId ?? 10;
  private readonly headquartersId = this.clientContext.current()?.headquartersId ?? 101;

  protected readonly activitiesCatalog = toSignal(
    this.activitiesApi.getAll({ hqId: this.headquartersId, page: 0, size: 200 }),
    {
      initialValue: null,
    },
  );

  protected readonly packages = toSignal(this.clientPackagesApi.getAll(this.userId), {
    initialValue: null,
  });
  protected readonly isLoading = computed(
    () => this.packages() === null || this.activitiesCatalog() === null,
  );
  protected readonly packageItems = computed(() => this.packages() ?? []);
  protected readonly activePackages = computed(() =>
    this.packageItems().filter((item) => item.active),
  );
  protected readonly previousPackages = computed(() =>
    this.packageItems().filter((item) => !item.active),
  );

  protected packageTitle(pack: ClientPackage): string {
    const credits = pack.credits ?? [];

    if (!credits.length) {
      return 'Paquete · Sin actividades asignadas';
    }

    const labels = credits.map((credit, index) => {
      const resolvedName = this.activityName(credit.activityId, credit.activityName);
      if (resolvedName) {
        return resolvedName;
      }
      return `Actividad sin nombre ${index + 1}`;
    });

    const hasNamedActivities = labels.some((label) => !label.startsWith('Actividad sin nombre'));
    const joinedActivities = labels.join(' + ');
    const totalSuffix = !hasNamedActivities
      ? ` (${labels.length} ${labels.length === 1 ? 'actividad' : 'actividades'})`
      : '';

    return `Paquete · ${joinedActivities}${totalSuffix}`;
  }

  protected totalTokens(pack: ClientPackage): number {
    return pack.credits.reduce((total, credit) => total + credit.tokens, 0);
  }

  private activityName(activityId?: number | null, activityName?: string | null): string | null {
    if (activityName?.trim()) {
      return activityName.trim();
    }

    if (activityId == null || !Number.isFinite(activityId)) {
      return null;
    }

    const catalogName = this.activitiesCatalog()
      ?.content.find((activity) => activity.id === activityId)
      ?.name?.trim();

    return catalogName?.length ? catalogName : null;
  }
}
