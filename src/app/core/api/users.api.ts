import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ApiResponse, Role, User } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';

const API_MOCK_MODE = true;

const MOCK_USERS: User[] = [
  {
    id: 10,
    name: 'Ariana',
    lastName: 'Wacelinka',
    email: 'ariana@athlium.app',
    firebaseUid: 'mock-ariana',
    roles: [Role.SUPERADMIN],
    active: true,
  },
  {
    id: 11,
    name: 'Juan',
    lastName: 'Perez',
    email: 'juan@athlium.app',
    firebaseUid: 'mock-juan',
    roles: [Role.ORG_ADMIN],
    active: true,
  },
  {
    id: 12,
    name: 'Sofia',
    lastName: 'Lopez',
    email: 'sofia@athlium.app',
    firebaseUid: 'mock-sofia',
    roles: [Role.PROFESSOR],
    active: true,
  },
  {
    id: 13,
    name: 'Bruno',
    lastName: 'Mendez',
    email: 'bruno@athlium.app',
    firebaseUid: 'mock-bruno',
    roles: [Role.CLIENT],
    active: false,
  },
];

export interface CreateUserRequest {
  firebaseUid: string;
  email: string;
  name: string;
  lastName: string;
}

export interface UpdateRolesRequest {
  roles: Role[];
}

function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiResponse<T>).data;
  }

  return response as T;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAll(): Observable<User[]> {
    if (API_MOCK_MODE) {
      return of(MOCK_USERS);
    }

    return this.http
      .get<ApiResponse<User[]> | User[]>(`${this.baseUrl}/users`)
      .pipe(map(unwrapApiResponse));
  }

  create(body: CreateUserRequest): Observable<User> {
    if (API_MOCK_MODE) {
      return of({
        id: Date.now(),
        firebaseUid: body.firebaseUid,
        email: body.email,
        name: body.name,
        lastName: body.lastName,
        roles: [Role.CLIENT],
        active: true,
      });
    }

    return this.http
      .post<ApiResponse<User> | User>(`${this.baseUrl}/users`, body)
      .pipe(map(unwrapApiResponse));
  }

  updateRoles(userId: number, body: UpdateRolesRequest): Observable<User> {
    if (API_MOCK_MODE) {
      const previous = MOCK_USERS.find((user) => user.id === userId) ?? MOCK_USERS[0];
      return of({ ...previous, id: userId, roles: body.roles });
    }

    return this.http
      .put<ApiResponse<User> | User>(`${this.baseUrl}/users/${userId}/roles`, body)
      .pipe(map(unwrapApiResponse));
  }
}
