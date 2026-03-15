import { computed, inject, Injectable } from '@angular/core';
import { AuthSessionService } from './auth-session.service';

export interface UserScopeHeadquarters {
  id: number;
  name: string;
  organizationId: number;
}

interface HeadquartersLike {
  id: number;
  name?: string;
  organizationId?: number;
}

@Injectable({ providedIn: 'root' })
export class UserScopeService {
  private readonly authSession = inject(AuthSessionService);

  readonly organizationId = computed(() => this.authSession.user()?.organization?.id ?? null);

  readonly headquarters = computed<UserScopeHeadquarters[]>(() => {
    const user = this.authSession.user();
    if (!user) {
      return [];
    }

    const organizationId = user.organization?.id ?? null;
    const source: HeadquartersLike[] = user.headquarters?.length
      ? user.headquarters
      : (user.organization?.headquarters ?? []);

    return source
      .filter((headquarters): headquarters is HeadquartersLike => !!headquarters?.id)
      .map((headquarters) => ({
        id: headquarters.id,
        name: headquarters.name ?? `Sede ${headquarters.id}`,
        organizationId: headquarters.organizationId ?? organizationId ?? 0,
      }))
      .filter((headquarters) => headquarters.organizationId > 0);
  });

  readonly defaultHeadquartersId = computed(() => this.headquarters()[0]?.id ?? null);
}
