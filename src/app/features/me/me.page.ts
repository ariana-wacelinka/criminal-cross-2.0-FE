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
  private readonly router = inject(Router);

  protected readonly authSession = inject(AuthSessionService);

  protected async goHome(): Promise<void> {
    await this.router.navigateByUrl('/');
  }

  protected async logout(): Promise<void> {
    await this.authFacade.logout();
    await this.router.navigateByUrl('/login');
  }
}
