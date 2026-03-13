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
  styles: [':host { display: block; }'],
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
    const activityNames = pack.credits
      .map((credit) => this.activityName(credit.activityId, credit.activityName))
      .filter((name) => !!name);

    if (!activityNames.length) {
      return `Paquete #${pack.id}`;
    }

    const preview = activityNames.slice(0, 2).join(' + ');
    const label = activityNames.length > 2 ? `${preview} + ...` : preview;
    return `Paquete ${label}`;
  }

  protected totalTokens(pack: ClientPackage): number {
    return pack.credits.reduce((total, credit) => total + credit.tokens, 0);
  }

  private activityName(activityId?: number | null, activityName?: string | null): string {
    if (activityName?.trim()) {
      return activityName;
    }

    if (activityId == null || !Number.isFinite(activityId)) {
      return 'Actividad';
    }

    return (
      this.activitiesCatalog()?.content.find((activity) => activity.id === activityId)?.name ??
      `Actividad #${activityId}`
    );
  }
}
