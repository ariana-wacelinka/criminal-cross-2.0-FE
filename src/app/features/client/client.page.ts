import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClientPackagesApi } from '../../core/api/client-packages.api';
import { AuthSessionService } from '../../core/auth';

@Component({
  selector: 'app-client-page',
  imports: [RouterLink],
  templateUrl: './client.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPage {
  private readonly authSession = inject(AuthSessionService);
  private readonly clientPackagesApi = inject(ClientPackagesApi);

  private readonly userId = computed(() => this.authSession.user()?.userId ?? 10);
  protected readonly allPackages = toSignal(this.clientPackagesApi.getAll(this.userId()), {
    initialValue: [],
  });
  protected readonly activePackages = toSignal(this.clientPackagesApi.getActive(this.userId()), {
    initialValue: [],
  });

  protected readonly activePackage = computed(() => this.activePackages()[0] ?? null);
  protected readonly bookingsCount = computed(() => 0);
  protected readonly packagesCount = computed(() => this.allPackages().length);
  protected readonly activeTokens = computed(
    () => this.activePackage()?.credits.reduce((total, credit) => total + credit.tokens, 0) ?? 0,
  );
}
