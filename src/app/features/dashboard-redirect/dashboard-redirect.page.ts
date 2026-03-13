import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../core/auth';
import { ClientContextService } from '../../core/client-context/client-context.service';
import { Role } from '../../core/domain/models';

@Component({
  selector: 'app-dashboard-redirect-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRedirectPage {
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  private readonly clientContext = inject(ClientContextService);

  constructor() {
    void this.redirect();
  }

  private async redirect(): Promise<void> {
    const role = this.authSession.user()?.roles[0];
    if (!role) {
      await this.router.navigateByUrl('/me');
      return;
    }

    switch (role) {
      case Role.SUPERADMIN:
        await this.router.navigateByUrl('/dashboard');
        return;
      case Role.ORG_OWNER:
        await this.router.navigateByUrl('/org-owner/dashboard');
        return;
      case Role.ORG_ADMIN:
        await this.router.navigateByUrl('/hq-admin/dashboard');
        return;
      case Role.PROFESSOR:
        await this.router.navigateByUrl('/professor/dashboard');
        return;
      case Role.CLIENT:
        await this.router.navigateByUrl(
          this.clientContext.isComplete() ? '/client/dashboard' : '/client/pre-onboarding',
        );
        return;
      default:
        await this.router.navigateByUrl('/hq-admin/dashboard');
    }
  }
}
