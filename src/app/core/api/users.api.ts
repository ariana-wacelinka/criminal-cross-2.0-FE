import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse, Role, User } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';

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
    return this.http
      .get<ApiResponse<User[]> | User[]>(`${this.baseUrl}/users`)
      .pipe(map(unwrapApiResponse));
  }

  create(body: CreateUserRequest): Observable<User> {
    return this.http
      .post<ApiResponse<User> | User>(`${this.baseUrl}/users`, body)
      .pipe(map(unwrapApiResponse));
  }

  updateRoles(userId: number, body: UpdateRolesRequest): Observable<User> {
    return this.http
      .put<ApiResponse<User> | User>(`${this.baseUrl}/users/${userId}/roles`, body)
      .pipe(map(unwrapApiResponse));
  }
}
