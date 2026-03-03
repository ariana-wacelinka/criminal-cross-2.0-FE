import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacadeService, AuthSessionService } from '../../core/auth';

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
