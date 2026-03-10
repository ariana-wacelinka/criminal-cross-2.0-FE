import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, AuthProvider, AuthenticatedUser, Role } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { SKIP_AUTH, SKIP_REFRESH } from '../http/request-context.tokens';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  lastName: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthenticatedUser;
}

interface BackendAuthenticatedUser {
  firebaseUid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  provider: string;
  userId: number;
  roles: string[];
  active: boolean;
}

interface BackendAuthPayload {
  user: BackendAuthenticatedUser;
  message?: string;
}

interface BackendLoginPayload {
  user: BackendAuthenticatedUser;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

function mapUser(user: BackendAuthenticatedUser): AuthenticatedUser {
  return {
    firebaseUid: user.firebaseUid,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    provider: user.provider as AuthProvider,
    userId: user.userId,
    roles: (user.roles ?? []) as Role[],
    active: user.active,
  };
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly publicEndpointContext = new HttpContext()
    .set(SKIP_AUTH, true)
    .set(SKIP_REFRESH, true);

  login(body: LoginRequest): Observable<AuthSessionResponse> {
    return this.http
      .post<ApiResponse<BackendLoginPayload> | BackendLoginPayload>(
        `${this.baseUrl}/auth/login`,
        body,
        {
          context: this.publicEndpointContext,
        },
      )
      .pipe(
        map(unwrapApiResponse),
        map((payload) => {
          if (!payload.tokens) {
            throw new Error(payload.message ?? 'El usuario necesita completar el registro.');
          }

          return {
            accessToken: payload.tokens.accessToken,
            refreshToken: payload.tokens.refreshToken,
            user: mapUser(payload.user),
          };
        }),
      );
  }

  register(body: RegisterRequest): Observable<AuthSessionResponse> {
    return this.http
      .post<ApiResponse<BackendLoginPayload> | BackendLoginPayload>(
        `${this.baseUrl}/auth/register`,
        body,
        {
          context: this.publicEndpointContext,
        },
      )
      .pipe(
        map(unwrapApiResponse),
        map((payload) => {
          if (!payload.tokens) {
            throw new Error(payload.message ?? 'No se pudo iniciar la sesión luego del registro.');
          }

          return {
            accessToken: payload.tokens.accessToken,
            refreshToken: payload.tokens.refreshToken,
            user: mapUser(payload.user),
          };
        }),
      );
  }

  me(): Observable<AuthenticatedUser> {
    return this.http
      .get<ApiResponse<BackendAuthPayload> | BackendAuthPayload>(`${this.baseUrl}/auth/me`)
      .pipe(
        map(unwrapApiResponse),
        map((payload) => mapUser(payload.user)),
      );
  }

  refresh(refreshToken?: string): Observable<AuthSessionResponse> {
    return this.http
      .post<ApiResponse<BackendLoginPayload> | BackendLoginPayload>(
        `${this.baseUrl}/auth/refresh`,
        { refreshToken },
        {
          context: this.publicEndpointContext,
        },
      )
      .pipe(
        map(unwrapApiResponse),
        map((payload) => {
          if (!payload.tokens) {
            throw new Error(payload.message ?? 'No se pudo refrescar la sesión.');
          }

          return {
            accessToken: payload.tokens.accessToken,
            refreshToken: payload.tokens.refreshToken,
            user: mapUser(payload.user),
          };
        }),
      );
  }
}
