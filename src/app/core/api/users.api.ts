import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ApiResponse, PageResult, Role, User } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

const MOCK_USERS: User[] = Array.from({ length: 64 }, (_, index) => {
  const id = index + 10;
  const name = [
    'Ariana',
    'Juan',
    'Sofia',
    'Bruno',
    'Camila',
    'Marcos',
    'Lucia',
    'Franco',
    'Valentina',
    'Nicolas',
  ][index % 10];
  const lastName = [
    'Wacelinka',
    'Perez',
    'Lopez',
    'Mendez',
    'Fernandez',
    'Suarez',
    'Gomez',
    'Rossi',
    'Diaz',
    'Alonso',
  ][Math.floor(index / 2) % 10];
  const rolePool = [Role.SUPERADMIN, Role.ORG_ADMIN, Role.PROFESSOR, Role.CLIENT, Role.ORG_OWNER];
  const role = rolePool[index % rolePool.length];
  const email = `${name.toLowerCase()}.${lastName.toLowerCase()}${id}@athlium.app`;
  return {
    id,
    name,
    lastName,
    email,
    firebaseUid: buildMockFirebaseUid(email),
    roles: [role],
    active: true,
  };
});

export interface CreateUserRequest {
  email: string;
  name: string;
  lastName: string;
}

export interface UpdateRolesRequest {
  roles: Role[];
}

export interface UpdateUserRequest {
  email: string;
  name: string;
  lastName: string;
}

function buildMockFirebaseUid(email: string): string {
  const normalized = email
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized ? `mock-${normalized}` : 'mock-user';
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }

  return response as T;
}

function mockUserOrganizationId(user: User): number {
  return (user.id % 24) + 1;
}

function mockUserHeadquartersId(user: User): number {
  return 101 + (user.id % 6);
}

function slicePage(items: User[], page: number, size: number): PageResult<User> {
  const safePage = Math.max(0, page);
  const safeSize = Math.max(1, size);
  const start = safePage * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    size: safeSize,
  };
}

function applyUserSearch(items: User[], search?: string): User[] {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((user) =>
    `${user.name} ${user.lastName} ${user.email}`.toLowerCase().includes(normalized),
  );
}

function toBackendPage(page: number): number {
  return Math.max(1, page + 1);
}

function fromBackendPage<T>(pageResult: PageResult<T>): PageResult<T> {
  const backendPage = Number.isFinite(pageResult.page) ? pageResult.page : 1;
  return {
    ...pageResult,
    page: Math.max(0, backendPage - 1),
  };
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getPage(page: number, size: number, search?: string): Observable<PageResult<User>> {
    if (API_MOCK_MODE) {
      return of(slicePage(applyUserSearch(MOCK_USERS, search), page, size));
    }

    return this.http
      .get<ApiResponse<PageResult<User>> | PageResult<User>>(`${this.baseUrl}/users`, {
        params: toHttpParams({ page: toBackendPage(page), size, search }),
      })
      .pipe(map(unwrapApiResponse), map(fromBackendPage));
  }

  getUsersByOrg(
    organizationId: number,
    page: number,
    size: number,
    search?: string,
  ): Observable<PageResult<User>> {
    if (API_MOCK_MODE) {
      const filtered = applyUserSearch(
        MOCK_USERS.filter((user) => mockUserOrganizationId(user) === organizationId),
        search,
      );
      return of(slicePage(filtered, page, size));
    }

    return this.http
      .get<ApiResponse<PageResult<User>> | PageResult<User>>(`${this.baseUrl}/users`, {
        params: toHttpParams({ organizationId, page: toBackendPage(page), size, search }),
      })
      .pipe(map(unwrapApiResponse), map(fromBackendPage));
  }

  getUsersByHq(
    headquartersId: number,
    page: number,
    size: number,
    search?: string,
  ): Observable<PageResult<User>> {
    if (API_MOCK_MODE) {
      const filtered = applyUserSearch(
        MOCK_USERS.filter((user) => mockUserHeadquartersId(user) === headquartersId),
        search,
      );
      return of(slicePage(filtered, page, size));
    }

    return this.http
      .get<ApiResponse<PageResult<User>> | PageResult<User>>(`${this.baseUrl}/users`, {
        params: toHttpParams({ headquartersId, page: toBackendPage(page), size, search }),
      })
      .pipe(map(unwrapApiResponse), map(fromBackendPage));
  }

  getAllUsers(): Observable<User[]> {
    return this.getAll();
  }

  getUserById(userId: number): Observable<User> {
    return this.getById(userId);
  }

  getAll(): Observable<User[]> {
    if (API_MOCK_MODE) {
      return of(MOCK_USERS);
    }

    return this.http
      .get<ApiResponse<User[]> | User[]>(`${this.baseUrl}/users`)
      .pipe(map(unwrapApiResponse));
  }

  getById(userId: number): Observable<User> {
    if (API_MOCK_MODE) {
      const user = MOCK_USERS.find((item) => item.id === userId);
      return of(
        user ?? {
          id: userId,
          name: 'Usuario',
          lastName: 'No encontrado',
          email: 'unknown@athlium.app',
          firebaseUid: 'unknown',
          roles: [Role.CLIENT],
          active: true,
        },
      );
    }

    return this.http
      .get<ApiResponse<User> | User>(`${this.baseUrl}/users/${userId}`)
      .pipe(map(unwrapApiResponse));
  }

  create(body: CreateUserRequest): Observable<User> {
    if (API_MOCK_MODE) {
      const createdId = Date.now();
      const created = {
        id: createdId,
        firebaseUid: buildMockFirebaseUid(body.email),
        email: body.email,
        name: body.name,
        lastName: body.lastName,
        roles: [Role.CLIENT],
        active: true,
      };
      MOCK_USERS.unshift(created);
      return of(created);
    }

    return this.http
      .post<ApiResponse<User> | User>(`${this.baseUrl}/users`, body)
      .pipe(map(unwrapApiResponse));
  }

  updateRoles(userId: number, body: UpdateRolesRequest): Observable<User> {
    if (API_MOCK_MODE) {
      const index = MOCK_USERS.findIndex((user) => user.id === userId);
      const previous = index >= 0 ? MOCK_USERS[index] : MOCK_USERS[0];
      const updated = { ...previous, id: userId, roles: body.roles };
      if (index >= 0) {
        MOCK_USERS[index] = updated;
      }
      return of(updated);
    }

    return this.http
      .put<ApiResponse<User> | User>(`${this.baseUrl}/users/${userId}/roles`, body)
      .pipe(map(unwrapApiResponse));
  }

  update(userId: number, body: UpdateUserRequest): Observable<User> {
    if (API_MOCK_MODE) {
      const index = MOCK_USERS.findIndex((user) => user.id === userId);
      const previous = index >= 0 ? MOCK_USERS[index] : MOCK_USERS[0];
      const updated = {
        ...previous,
        id: userId,
        email: body.email,
        name: body.name,
        lastName: body.lastName,
      };
      if (index >= 0) {
        MOCK_USERS[index] = updated;
      }
      return of(updated);
    }

    return this.http
      .put<ApiResponse<User> | User>(`${this.baseUrl}/users/${userId}`, body)
      .pipe(map(unwrapApiResponse));
  }

  remove(userId: number): Observable<void> {
    if (API_MOCK_MODE) {
      const index = MOCK_USERS.findIndex((user) => user.id === userId);
      if (index >= 0) {
        MOCK_USERS.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }
}
