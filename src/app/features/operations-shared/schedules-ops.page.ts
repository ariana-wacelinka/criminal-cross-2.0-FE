import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, switchMap } from 'rxjs';
import {
  ActivitySchedulesApi,
  CreateActivityScheduleRequest,
} from '../../core/api/activity-schedules.api';
import { ActivitiesApi } from '../../core/api/activities.api';
import { HeadquartersApi } from '../../core/api/headquarters.api';
import { WeekDay } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-schedules-ops-page',
  imports: [ReactiveFormsModule],
  templateUrl: './schedules-ops.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulesOpsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly schedulesApi = inject(ActivitySchedulesApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly headquartersApi = inject(HeadquartersApi);
  private readonly toast = inject(UiToastService);

  private readonly scope = this.route.snapshot.data['scope'] as 'org' | 'hq';
  private readonly organizationId = 1;
  private readonly fixedHeadquartersId = 101;
  protected readonly title = this.scope === 'org' ? 'Horarios por sede' : 'Horarios';
  private readonly refreshTick = signal(0);

  protected readonly selectedHeadquartersId = signal<number>(
    this.scope === 'hq' ? this.fixedHeadquartersId : 0,
  );
  protected readonly showForm = signal(false);
  protected readonly editingScheduleId = signal<number | null>(null);
  protected readonly activityQuery = signal('');
  protected readonly showActivityOptions = signal(false);
  protected readonly weekDaysTouched = signal(false);
  protected readonly dayOptions: ReadonlyArray<{ value: WeekDay; label: string }> = [
    { value: WeekDay.MONDAY, label: 'Lunes' },
    { value: WeekDay.TUESDAY, label: 'Martes' },
    { value: WeekDay.WEDNESDAY, label: 'Miércoles' },
    { value: WeekDay.THURSDAY, label: 'Jueves' },
    { value: WeekDay.FRIDAY, label: 'Viernes' },
    { value: WeekDay.SATURDAY, label: 'Sábado' },
    { value: WeekDay.SUNDAY, label: 'Domingo' },
  ];
  protected readonly selectedWeekDays = signal<WeekDay[]>([WeekDay.MONDAY, WeekDay.WEDNESDAY]);

  protected readonly headquartersPage = toSignal(
    this.headquartersApi.getPage(0, 100, this.organizationId),
    { initialValue: null },
  );
  protected readonly headquarters = computed(() => this.headquartersPage()?.items ?? []);

  private readonly schedulesRequest = computed(() => ({
    headquartersId: this.selectedHeadquartersId(),
    refresh: this.refreshTick(),
  }));

  protected readonly schedules = toSignal(
    toObservable(this.schedulesRequest).pipe(
      switchMap(({ headquartersId }) =>
        headquartersId
          ? this.schedulesApi.getAll(headquartersId)
          : this.schedulesApi.getAll(this.fixedHeadquartersId),
      ),
    ),
    { initialValue: null },
  );

  private readonly activitiesRequest = computed(() => ({
    headquartersId: this.selectedHeadquartersId() || this.fixedHeadquartersId,
    name: this.activityQuery().trim(),
  }));

  protected readonly activitiesPage = toSignal(
    toObservable(this.activitiesRequest).pipe(
      switchMap(({ headquartersId, name }) =>
        this.activitiesApi.getAll({
          hqId: headquartersId,
          name: name || undefined,
          page: 0,
          size: 20,
        }),
      ),
    ),
    { initialValue: null },
  );

  protected readonly isLoading = computed(() => !this.schedules() || !this.activitiesPage());
  protected readonly activities = computed(() => this.activitiesPage()?.content ?? []);
  protected readonly filteredActivities = computed(() => this.activities());
  protected readonly hasItems = computed(() => (this.schedules()?.length ?? 0) > 0);

  protected readonly form = new FormGroup({
    activityId: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    startTime: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    durationMinutes: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(15)],
    }),
    activeFrom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    activeUntil: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly showWeekDaysError = computed(
    () => this.weekDaysTouched() && this.selectedWeekDays().length === 0,
  );
  protected readonly showDateRangeError = computed(() => {
    const from = this.form.controls.activeFrom.value;
    const until = this.form.controls.activeUntil.value;
    if (!from || !until) {
      return false;
    }
    return from > until;
  });

  constructor() {
    effect(() => {
      const headquarters = this.headquarters();
      if (this.scope === 'org' && !this.selectedHeadquartersId() && headquarters.length) {
        this.selectedHeadquartersId.set(headquarters[0].id);
      }
    });
  }

  protected selectHeadquarters(value: string): void {
    if (this.scope === 'hq') {
      return;
    }
    this.selectedHeadquartersId.set(Number(value));
    this.editingScheduleId.set(null);
  }

  protected editSchedule(scheduleId: number): void {
    const schedule = this.schedules()?.find((item) => item.id === scheduleId);
    if (!schedule) {
      return;
    }

    this.editingScheduleId.set(scheduleId);
    this.showForm.set(true);
    this.selectedWeekDays.set((schedule.weekDays ?? []) as WeekDay[]);
    this.weekDaysTouched.set(false);
    this.form.patchValue({
      activityId: schedule.activityId,
      startTime: schedule.startTime,
      durationMinutes: schedule.durationMinutes,
      activeFrom: schedule.activeFrom ?? '',
      activeUntil: schedule.activeUntil ?? '',
    });
    this.activityQuery.set(this.activityName(schedule.activityId));
    this.showActivityOptions.set(false);
  }

  protected resetForm(): void {
    this.selectedWeekDays.set([]);
    this.form.patchValue({
      activityId: 0,
      startTime: '',
      durationMinutes: null,
      activeFrom: '',
      activeUntil: '',
    });
    this.activityQuery.set('');
    this.showActivityOptions.set(false);
    this.weekDaysTouched.set(false);
  }

  protected openCreateForm(): void {
    this.editingScheduleId.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.editingScheduleId.set(null);
    this.showForm.set(false);
    this.resetForm();
  }

  protected setActivityQuery(value: string): void {
    this.activityQuery.set(value);
    this.showActivityOptions.set(true);
    this.form.patchValue({ activityId: 0 });
  }

  protected selectActivity(activityId: number): void {
    const activity = this.activities().find((item) => item.id === activityId);
    this.form.patchValue({ activityId });
    this.activityQuery.set(activity?.name ?? '');
    this.showActivityOptions.set(false);
  }

  protected openActivitySelector(): void {
    this.showActivityOptions.set(true);
  }

  protected closeActivitySelector(): void {
    setTimeout(() => this.showActivityOptions.set(false), 120);
  }

  protected async saveSchedule(): Promise<void> {
    if (this.form.invalid || !this.selectedHeadquartersId()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.selectedWeekDays().length) {
      this.weekDaysTouched.set(true);
      this.toast.error('Selecciona al menos un día.');
      return;
    }

    if (this.showDateRangeError()) {
      this.toast.error('La fecha de fin debe ser igual o posterior a la de inicio.');
      return;
    }

    const payload: CreateActivityScheduleRequest = {
      organizationId: this.organizationId,
      headquartersId: this.selectedHeadquartersId(),
      activityId: this.form.controls.activityId.value,
      weekDays: this.selectedWeekDays(),
      startTime: this.form.controls.startTime.value,
      durationMinutes: this.form.controls.durationMinutes.value!,
      active: true,
      schedulerType: 'WEEKLY_RANGE',
      templateType: 'WEEKLY_RANGE',
      activeFrom: this.form.controls.activeFrom.value || undefined,
      activeUntil: this.form.controls.activeUntil.value || undefined,
    };

    try {
      if (this.editingScheduleId()) {
        await firstValueFrom(this.schedulesApi.update(this.editingScheduleId()!, payload));
        this.toast.success('Horario actualizado.');
      } else {
        await firstValueFrom(this.schedulesApi.create(payload));
        this.toast.success('Horario creado.');
      }

      this.refreshTick.update((value) => value + 1);
      this.closeForm();
    } catch {
      this.toast.error('No se pudo guardar el horario.');
    }
  }

  protected async removeSchedule(scheduleId: number): Promise<void> {
    try {
      await firstValueFrom(this.schedulesApi.remove(scheduleId));
      this.refreshTick.update((value) => value + 1);
      this.toast.success('Horario eliminado.');
      if (this.editingScheduleId() === scheduleId) {
        this.closeForm();
      }
    } catch {
      this.toast.error('No se pudo eliminar el horario.');
    }
  }

  protected activityName(activityId: number): string {
    return (
      this.activitiesPage()?.content.find((activity) => activity.id === activityId)?.name ??
      `Actividad #${activityId}`
    );
  }

  protected isSelectedDay(day: WeekDay): boolean {
    return this.selectedWeekDays().includes(day);
  }

  protected toggleDay(day: WeekDay): void {
    this.weekDaysTouched.set(true);
    this.selectedWeekDays.update((days) =>
      days.includes(day) ? days.filter((item) => item !== day) : [...days, day],
    );
  }

  protected formatWeekDays(days: WeekDay[] | undefined): string {
    if (!days?.length) {
      return '-';
    }

    return days
      .map((day) => this.dayOptions.find((option) => option.value === day)?.label ?? day)
      .join(', ');
  }
}
