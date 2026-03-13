import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientPackagesApi } from '../../core/api/client-packages.api';
import { ClientPackage, ClientPackageCredit } from '../../core/domain/models';
import { UsersApi } from '../../core/api/users.api';

@Component({
  selector: 'app-superadmin-user-detail-page',
  templateUrl: './superadmin-user-detail.page.html',
  styles: [
    `
      :host {
        display: block;
      }

      .package-card {
        padding: 0.75rem;
        border-radius: 0.75rem;
      }

      .package-title {
        font-size: 0.95rem;
        font-weight: 600;
        text-wrap: pretty;
        overflow-wrap: anywhere;
      }

      .package-meta {
        margin-top: 0.35rem;
        font-size: 0.75rem;
        color: var(--athlium-muted, #94a3b8);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperadminUserDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApi);
  private readonly clientPackagesApi = inject(ClientPackagesApi);

  private readonly userId = Number(this.route.snapshot.paramMap.get('userId'));

  protected readonly user = toSignal(this.usersApi.getById(this.userId), {
    initialValue: null,
  });

  protected readonly fullName = computed(() => {
    const user = this.user();
    return user ? `${user.name} ${user.lastName}`.trim() : 'Cargando usuario';
  });

  protected readonly userPackages = toSignal(this.clientPackagesApi.getAll(this.userId), {
    initialValue: null,
  });
  protected readonly isLoading = computed(
    () => this.user() === null || this.userPackages() === null,
  );
  protected readonly packageItems = computed(() => this.userPackages() ?? []);
  protected readonly activePackages = computed(() =>
    this.packageItems().filter((item) => item.active),
  );
  protected readonly previousPackages = computed(() =>
    this.packageItems().filter((item) => !item.active),
  );

  protected packageTitle(pack: ClientPackage): string {
    if (!pack.credits.length) {
      return 'Paquete · Sin actividades asignadas';
    }

    const names = pack.credits.map((credit, index) => this.creditActivityName(credit, index));
    const hasNamedActivities = names.some((name) => !name.startsWith('Actividad sin nombre'));
    const joined = names.join(' + ');
    const suffix = !hasNamedActivities
      ? ` (${names.length} ${names.length === 1 ? 'actividad' : 'actividades'})`
      : '';

    return `Paquete · ${joined}${suffix}`;
  }

  protected creditActivityName(credit: ClientPackageCredit, index: number): string {
    const label = credit.activityName?.trim();
    if (label) {
      return label;
    }

    if (Number.isFinite(credit.activityId)) {
      return `Actividad #${credit.activityId}`;
    }

    return `Actividad sin nombre ${index + 1}`;
  }

  protected totalTokens(pack: ClientPackage): number {
    return pack.credits.reduce((total, credit) => total + (credit.tokens ?? 0), 0);
  }

  protected async goBack(): Promise<void> {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    await this.router.navigateByUrl('/users');
  }
}
