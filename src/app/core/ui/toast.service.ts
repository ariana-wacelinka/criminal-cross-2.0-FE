import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface UiToast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class UiToastService {
  private readonly nextId = signal(1);
  protected readonly _toasts = signal<UiToast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType = 'info', durationMs = 2600): void {
    const id = this.nextId();
    this.nextId.update((value) => value + 1);

    this._toasts.update((items) => [...items, { id, message, type }]);

    if (durationMs > 0) {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  success(message: string, durationMs = 2200): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 3000): void {
    this.show(message, 'error', durationMs);
  }

  dismiss(id: number): void {
    this._toasts.update((items) => items.filter((item) => item.id !== id));
  }
}
