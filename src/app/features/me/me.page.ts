import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacadeService, AuthSessionService } from '../../core/auth';
import { Role } from '../../core/domain/models';

@Component({
  selector: 'app-me-page',
  templateUrl: './me.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MePage {
  private readonly authFacade = inject(AuthFacadeService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected readonly authSession = inject(AuthSessionService);
  protected readonly showActiveRoles = computed(
    () => this.authSession.user()?.roles.includes(Role.SUPERADMIN) ?? false,
  );

  protected async goBack(): Promise<void> {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    await this.router.navigateByUrl('/dashboard');
  }

  protected async logout(): Promise<void> {
    await this.authFacade.logout();
    await this.router.navigateByUrl('/login');
  }
}
