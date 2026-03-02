import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivitySchedule } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

export interface CreateActivityScheduleRequest {
    organizationId: number;
    headquartersId: number;
    activityId: number;
    dayOfWeek?: number;
    weekDays?: string[];
    startTime: string;
    durationMinutes: number;
    active: boolean;
    schedulerType: string;
    templateType: string;
    activeFrom?: string;
    activeUntil?: string;
    scheduledDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ActivitySchedulesApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    create(body: CreateActivityScheduleRequest): Observable<ActivitySchedule> {
        return this.http.post<ActivitySchedule>(`${this.baseUrl}/activity-schedules`, body);
    }

    getAll(headquartersId: number): Observable<ActivitySchedule[]> {
        return this.http.get<ActivitySchedule[]>(`${this.baseUrl}/activity-schedules`, {
            params: toHttpParams({ headquartersId }),
        });
    }

    generateNextWeek(): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/activity-schedules/generate-next-week`, {});
    }
}
