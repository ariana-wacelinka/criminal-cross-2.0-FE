import { Injectable, inject } from '@angular/core';
import { AuthSessionService } from '../auth/auth-session.service';
import { Role } from '../domain/models';

function fromUserDefaults(user: {
  organization?: { id: number } | null;
  headquarters?: { id: number }[] | null;
}): ClientContextSelection | null {
  if (!user.organization?.id || !user.headquarters?.length) {
    return null;
  }

  const firstHq = user.headquarters[0];
  if (!firstHq?.id) {
    return null;
  }

  return {
    organizationId: user.organization.id,
    headquartersId: firstHq.id,
  };
}

export interface ClientContextSelection {
  organizationId: number;
  headquartersId: number;
}

@Injectable({ providedIn: 'root' })
export class ClientContextService {
  private readonly authSession = inject(AuthSessionService);

  current(): ClientContextSelection | null {
    const user = this.authSession.user();
    if (!user || !user.roles.includes(Role.CLIENT)) {
      return null;
    }

    const raw = localStorage.getItem(this.storageKey(user.userId));
    if (!raw) {
      return fromUserDefaults(user);
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ClientContextSelection>;
      if (!Number.isFinite(parsed.organizationId) || !Number.isFinite(parsed.headquartersId)) {
        return fromUserDefaults(user) ?? null;
      }
      return {
        organizationId: Number(parsed.organizationId),
        headquartersId: Number(parsed.headquartersId),
      };
    } catch {
      return fromUserDefaults(user);
    }
  }

  isComplete(): boolean {
    return !!this.current();
  }

  save(selection: ClientContextSelection): void {
    const user = this.authSession.user();
    if (!user || !user.roles.includes(Role.CLIENT)) {
      return;
    }

    localStorage.setItem(this.storageKey(user.userId), JSON.stringify(selection));
  }

  clear(): void {
    const user = this.authSession.user();
    if (!user) {
      return;
    }

    localStorage.removeItem(this.storageKey(user.userId));
  }

  private storageKey(userId: number): string {
    return `athlium-client-context:${userId}`;
  }
}
