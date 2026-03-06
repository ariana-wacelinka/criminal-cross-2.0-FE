import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSessionService } from '../../core/auth';
import { Role } from '../../core/domain/models';

@Component({
  selector: 'app-dashboard-redirect-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRedirectPage {
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);

  constructor() {
    void this.redirect();
  }

  private async redirect(): Promise<void> {
    const role = this.authSession.user()?.roles[0] ?? Role.ORG_ADMIN;
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
        await this.router.navigateByUrl('/client/dashboard');
        return;
      default:
        await this.router.navigateByUrl('/hq-admin/dashboard');
    }
  }
}
