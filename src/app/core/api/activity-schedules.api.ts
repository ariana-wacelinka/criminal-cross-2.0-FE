import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ActivitySchedule, SchedulerType, SessionTemplateType, WeekDay } from '../domain/models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { toHttpParams } from '../http/http-params.util';

const API_MOCK_MODE = true;

const MOCK_ACTIVITY_SCHEDULES: ActivitySchedule[] = Array.from({ length: 42 }, (_, index) => ({
  id: index + 1,
  organizationId: 1,
  headquartersId: 101 + (index % 6),
  activityId: (index % 20) + 1,
  weekDays: [
    [WeekDay.MONDAY, WeekDay.WEDNESDAY],
    [WeekDay.TUESDAY, WeekDay.THURSDAY],
    [WeekDay.FRIDAY],
  ][index % 3],
  startTime: `${String(8 + (index % 10)).padStart(2, '0')}:00:00`,
  durationMinutes: [45, 50, 60][index % 3],
  active: true,
  schedulerType: index % 2 ? SchedulerType.WEEKLY_RANGE : SchedulerType.ONE_TIME_DISPOSABLE,
  templateType:
    index % 2 ? SessionTemplateType.WEEKLY_RANGE : SessionTemplateType.ONE_TIME_DISPOSABLE,
  activeFrom: '2026-03-01',
  activeUntil: '2026-06-30',
}));

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
    if (API_MOCK_MODE) {
      const created: ActivitySchedule = {
        id: Date.now(),
        organizationId: body.organizationId,
        headquartersId: body.headquartersId,
        activityId: body.activityId,
        dayOfWeek: body.dayOfWeek,
        weekDays: body.weekDays as WeekDay[] | undefined,
        startTime: body.startTime,
        durationMinutes: body.durationMinutes,
        active: body.active,
        schedulerType: body.schedulerType as SchedulerType,
        templateType: body.templateType as SessionTemplateType,
        activeFrom: body.activeFrom,
        activeUntil: body.activeUntil,
        scheduledDate: body.scheduledDate,
      };
      MOCK_ACTIVITY_SCHEDULES.unshift(created);
      return of(created);
    }

    return this.http.post<ActivitySchedule>(`${this.baseUrl}/activity-schedules`, body);
  }

  getAll(headquartersId: number): Observable<ActivitySchedule[]> {
    if (API_MOCK_MODE) {
      return of(MOCK_ACTIVITY_SCHEDULES.filter((item) => item.headquartersId === headquartersId));
    }

    return this.http.get<ActivitySchedule[]>(`${this.baseUrl}/activity-schedules`, {
      params: toHttpParams({ headquartersId }),
    });
  }

  update(id: number, body: CreateActivityScheduleRequest): Observable<ActivitySchedule> {
    if (API_MOCK_MODE) {
      const index = MOCK_ACTIVITY_SCHEDULES.findIndex((item) => item.id === id);
      const updated: ActivitySchedule = {
        id,
        organizationId: body.organizationId,
        headquartersId: body.headquartersId,
        activityId: body.activityId,
        dayOfWeek: body.dayOfWeek,
        weekDays: body.weekDays as WeekDay[] | undefined,
        startTime: body.startTime,
        durationMinutes: body.durationMinutes,
        active: body.active,
        schedulerType: body.schedulerType as SchedulerType,
        templateType: body.templateType as SessionTemplateType,
        activeFrom: body.activeFrom,
        activeUntil: body.activeUntil,
        scheduledDate: body.scheduledDate,
      };
      if (index >= 0) {
        MOCK_ACTIVITY_SCHEDULES[index] = updated;
      }
      return of(updated);
    }

    return this.http.put<ActivitySchedule>(`${this.baseUrl}/activity-schedules/${id}`, body);
  }

  remove(id: number): Observable<void> {
    if (API_MOCK_MODE) {
      const index = MOCK_ACTIVITY_SCHEDULES.findIndex((item) => item.id === id);
      if (index >= 0) {
        MOCK_ACTIVITY_SCHEDULES.splice(index, 1);
      }
      return of(void 0);
    }

    return this.http.delete<void>(`${this.baseUrl}/activity-schedules/${id}`);
  }

  generateNextWeek(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/activity-schedules/generate-next-week`, {});
  }
}
