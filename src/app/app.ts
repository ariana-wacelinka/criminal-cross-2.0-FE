import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastService } from './core/ui/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>

    <div
      class="pointer-events-none fixed bottom-20 right-3 z-[90] grid w-[min(92vw,360px)] gap-2 lg:bottom-3"
    >
      @for (toast of toasts(); track toast.id) {
        <article
          class="pointer-events-auto ath-reveal rounded-xl border px-3 py-2 text-sm shadow-soft"
          [class.border-red-400/35]="toast.type === 'error'"
          [class.bg-red-500/15]="toast.type === 'error'"
          [class.text-red-100]="toast.type === 'error'"
          [class.border-athlium-accent/30]="toast.type === 'success'"
          [class.bg-athlium-accent/15]="toast.type === 'success'"
          [class.text-athlium-accent]="toast.type === 'success'"
          [class.border-athlium-primary/20]="toast.type === 'info'"
          [class.bg-athlium-surface/95]="toast.type === 'info'"
          [class.text-athlium-text]="toast.type === 'info'"
        >
          <div class="flex items-start justify-between gap-2">
            <p>{{ toast.message }}</p>
            <button
              type="button"
              class="text-athlium-muted transition hover:text-athlium-text"
              (click)="dismissToast(toast.id)"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </article>
      }
    </div>
  `,
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly toast = inject(UiToastService);

  protected readonly toasts = this.toast.toasts;

  protected dismissToast(id: number): void {
    this.toast.dismiss(id);
  }
}
