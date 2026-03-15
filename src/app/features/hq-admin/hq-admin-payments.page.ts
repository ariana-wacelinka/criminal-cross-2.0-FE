import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { ClientPackagesApi } from '../../core/api/client-packages.api';
import { CreatePaymentRequest, PaymentListItem, PaymentsApi } from '../../core/api/payments.api';
import { UsersApi } from '../../core/api/users.api';
import { UserScopeService } from '../../core/auth';
import { PaymentMethod } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

interface RecentPaymentItem {
  paymentId: number;
  amount: string;
  paymentMethod: string;
  paidAt: string;
  userName: string;
  activitiesSummary?: string;
}

interface PackageActivitySelection {
  activityId: number;
  activityName: string;
  tokens: number;
}

@Component({
  selector: 'app-hq-admin-payments-page',
  imports: [ReactiveFormsModule],
  templateUrl: './hq-admin-payments.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HqAdminPaymentsPage {
  private readonly paymentsApi = inject(PaymentsApi);
  private readonly usersApi = inject(UsersApi);
  private readonly activitiesApi = inject(ActivitiesApi);
  private readonly clientPackagesApi = inject(ClientPackagesApi);
  private readonly userScope = inject(UserScopeService);
  private readonly toast = inject(UiToastService);

  private readonly headquartersId = computed(() => this.userScope.defaultHeadquartersId());
  private readonly organizationId = computed(() => this.userScope.organizationId());
  private readonly pageSize = 12;
  private readonly paymentMethods = [
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.TRANSFER,
    PaymentMethod.OTHER,
  ] as const;

  protected readonly methodOptions = this.paymentMethods;
  protected readonly showForm = signal(false);
  protected readonly userQuery = signal('');
  private readonly selectedUserName = signal('');
  protected readonly activityQuery = signal('');
  protected readonly showUserOptions = signal(false);
  protected readonly showActivityOptions = signal(false);
  protected readonly packageActivitiesTouched = signal(false);
  protected readonly packageActivities = signal<PackageActivitySelection[]>([]);

  protected readonly usersPage = toSignal(
    toObservable(
      computed(() => ({
        headquartersId: this.headquartersId(),
        search: this.userQuery().trim(),
      })),
    ).pipe(
      switchMap(({ headquartersId, search }) => {
        if (!headquartersId) {
          return of({ items: [], total: 0, page: 0, size: 20 });
        }
        return this.usersApi.getUsersByHq(headquartersId, 0, 20, search || undefined);
      }),
    ),
    { initialValue: null },
  );
  protected readonly users = computed(() => this.usersPage()?.items ?? []);
  protected readonly filteredUsers = computed(() => {
    const query = this.userQuery().trim().toLowerCase();
    if (!query) {
      return this.users();
    }
    return this.users().filter((user) =>
      `${user.name} ${user.lastName} ${user.email}`.toLowerCase().includes(query),
    );
  });

  protected readonly activitiesPage = toSignal(
    toObservable(
      computed(() => ({
        headquartersId: this.headquartersId(),
        name: this.activityQuery().trim(),
      })),
    ).pipe(
      switchMap(({ headquartersId, name }) => {
        if (!headquartersId) {
          return of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
        }

        return this.activitiesApi.getAll({
          hqId: headquartersId,
          name: name || undefined,
          page: 0,
          size: 20,
        });
      }),
    ),
    { initialValue: null },
  );
  protected readonly activities = computed(() => this.activitiesPage()?.content ?? []);
  protected readonly canShowPackageActivitiesError = computed(
    () => this.packageActivitiesTouched() && this.packageActivities().length === 0,
  );

  protected readonly paymentsByHqPage = toSignal(
    toObservable(this.headquartersId).pipe(
      switchMap((headquartersId) =>
        headquartersId
          ? this.paymentsApi.getAllByHq(headquartersId, 0, this.pageSize)
          : of({ items: [], total: 0, page: 0, size: this.pageSize }),
      ),
    ),
    { initialValue: null },
  );
  private readonly createdPayments = signal<RecentPaymentItem[]>([]);

  protected readonly isLoadingCatalogs = computed(
    () => !this.usersPage() || !this.activitiesPage(),
  );
  protected readonly paymentHistory = computed<RecentPaymentItem[]>(() => [
    ...this.createdPayments(),
    ...(this.paymentsByHqPage()?.items ?? []).map((item) => this.mapPaymentListItem(item)),
  ]);

  protected readonly isSubmitting = signal(false);

  protected readonly form = new FormGroup({
    userId: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    paymentMethod: new FormControl<PaymentMethod | string>(PaymentMethod.CASH, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected paymentMethodLabel(method: string): string {
    switch (method) {
      case PaymentMethod.CASH:
        return 'Efectivo';
      case PaymentMethod.CARD:
        return 'Tarjeta';
      case PaymentMethod.TRANSFER:
        return 'Transferencia';
      case PaymentMethod.OTHER:
        return 'Otro';
      default:
        return method;
    }
  }

  protected paymentDateLabel(isoDate: string): string {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }

    return parsed.toLocaleDateString('es-AR');
  }

  protected openCreateForm(): void {
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.userQuery.set('');
    this.selectedUserName.set('');
    this.activityQuery.set('');
    this.showUserOptions.set(false);
    this.showActivityOptions.set(false);
    this.packageActivitiesTouched.set(false);
    this.packageActivities.set([]);
    this.form.patchValue({
      userId: 0,
      amount: null,
      paymentMethod: PaymentMethod.CASH,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  protected setUserSearch(value: string): void {
    this.userQuery.set(value);
    this.selectedUserName.set('');
    this.showUserOptions.set(true);
    this.form.patchValue({ userId: 0 });
  }

  protected setActivitySearch(value: string): void {
    this.activityQuery.set(value);
    this.showActivityOptions.set(true);
  }

  protected openUserSelector(): void {
    this.showUserOptions.set(true);
  }

  protected closeUserSelector(): void {
    setTimeout(() => this.showUserOptions.set(false), 120);
  }

  protected selectUser(userId: number): void {
    const user = this.users().find((item) => item.id === userId);
    const userLabel = user ? `${user.name} ${user.lastName}`.trim() : '';
    this.form.patchValue({ userId });
    this.userQuery.set(user ? `${user.name} ${user.lastName} (${user.email})` : '');
    this.selectedUserName.set(userLabel);
    this.showUserOptions.set(false);
  }

  protected openActivitySelector(): void {
    this.showActivityOptions.set(true);
  }

  protected closeActivitySelector(): void {
    setTimeout(() => this.showActivityOptions.set(false), 120);
  }

  protected selectActivity(activityId: number): void {
    const activity = this.activities().find((item) => item.id === activityId);
    if (!activity) {
      return;
    }

    const alreadyExists = this.packageActivities().some((item) => item.activityId === activityId);
    if (!alreadyExists) {
      this.packageActivities.update((current) => [
        ...current,
        {
          activityId,
          activityName: activity.name,
          tokens: 1,
        },
      ]);
    }

    this.packageActivitiesTouched.set(true);
    this.activityQuery.set('');
    this.showActivityOptions.set(false);
  }

  protected updatePackageActivityTokens(activityId: number, value: string): void {
    const parsed = Number(value);
    this.packageActivities.update((current) =>
      current.map((item) =>
        item.activityId === activityId
          ? {
              ...item,
              tokens: Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0,
            }
          : item,
      ),
    );
  }

  protected removePackageActivity(activityId: number): void {
    this.packageActivities.update((current) =>
      current.filter((item) => item.activityId !== activityId),
    );
    this.packageActivitiesTouched.set(true);
  }

  protected async createPaymentAndPackage(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedActivities = this.packageActivities();
    if (!selectedActivities.length) {
      this.packageActivitiesTouched.set(true);
      this.toast.error('Agrega al menos una actividad al paquete.');
      return;
    }

    if (selectedActivities.some((item) => item.tokens < 1)) {
      this.toast.error('Los tokens de cada actividad deben ser mayores a 0.');
      return;
    }

    this.isSubmitting.set(true);

    const userId = this.form.controls.userId.value;
    const amount = Number(this.form.controls.amount.value);
    const paymentMethod = this.form.controls.paymentMethod.value;

    const headquartersId = this.headquartersId();
    const organizationId = this.organizationId();
    if (!headquartersId || !organizationId) {
      this.toast.error('No se pudo resolver sede/organización para registrar el pago.');
      this.isSubmitting.set(false);
      return;
    }

    const paymentPayload: CreatePaymentRequest = {
      amount: amount.toFixed(2),
      paymentMethod,
      clientId: userId,
      headquartersId,
      organizationId,
    };

    try {
      const payment = await firstValueFrom(this.paymentsApi.create(paymentPayload));
      const activityTokens = Object.fromEntries(
        selectedActivities.map((item) => [String(item.activityId), item.tokens]),
      );
      await firstValueFrom(
        this.clientPackagesApi.create(userId, {
          paymentId: payment.id,
          activityTokens,
        }),
      );

      const selectedUserName = this.selectedUserName().trim();
      const user = this.users().find((item) => item.id === userId);
      this.createdPayments.update((current) => [
        {
          paymentId: payment.id,
          amount: payment.amount,
          paymentMethod: String(payment.paymentMethod),
          paidAt: payment.paidAt,
          userName:
            selectedUserName ||
            (user ? `${user.name} ${user.lastName}`.trim() : `Usuario #${userId}`),
          activitiesSummary: this.activitiesSummary(selectedActivities),
        },
        ...current,
      ]);

      this.toast.success('Pago y paquete creados.');
      this.closeForm();
    } catch {
      this.toast.error('No se pudo registrar el pago.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private mapPaymentListItem(item: PaymentListItem): RecentPaymentItem {
    const summaries =
      item.activities?.map((activity) => activity.name).filter((name) => !!name?.trim()) ?? [];

    return {
      paymentId: item.id,
      amount: item.amount,
      paymentMethod: String(item.paymentMethod),
      paidAt: item.paidAt,
      userName: `${item.userName} ${item.userLastName}`,
      activitiesSummary: summaries.length ? summaries.join(' + ') : undefined,
    };
  }

  private activitiesSummary(activities: PackageActivitySelection[]): string {
    return activities.map((item) => item.activityName).join(' + ');
  }
}
