import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, switchMap } from 'rxjs';
import { ActivitiesApi } from '../../core/api/activities.api';
import { ClientPackagesApi } from '../../core/api/client-packages.api';
import { CreatePaymentRequest, PaymentListItem, PaymentsApi } from '../../core/api/payments.api';
import { UsersApi } from '../../core/api/users.api';
import { PaymentMethod } from '../../core/domain/models';
import { UiToastService } from '../../core/ui/toast.service';

interface RecentPaymentItem {
  paymentId: number;
  amount: string;
  paymentMethod: string;
  paidAt: string;
  userName: string;
  activityName?: string;
  tokens?: number;
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
  private readonly toast = inject(UiToastService);

  private readonly headquartersId = 101;
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
  protected readonly activityQuery = signal('');
  protected readonly showUserOptions = signal(false);
  protected readonly showActivityOptions = signal(false);

  protected readonly usersPage = toSignal(
    toObservable(this.userQuery).pipe(
      switchMap((search) =>
        this.usersApi.getUsersByHq(this.headquartersId, 0, 20, search.trim() || undefined),
      ),
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
    toObservable(this.activityQuery).pipe(
      switchMap((name) =>
        this.activitiesApi.getAll({
          hqId: this.headquartersId,
          name: name.trim() || undefined,
          page: 0,
          size: 20,
        }),
      ),
    ),
    { initialValue: null },
  );
  protected readonly activities = computed(() => this.activitiesPage()?.content ?? []);

  protected readonly paymentsByHqPage = toSignal(
    this.paymentsApi.getAllByHq(this.headquartersId, 0, this.pageSize),
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
    activityId: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    tokens: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
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

  protected openCreateForm(): void {
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.userQuery.set('');
    this.activityQuery.set('');
    this.showUserOptions.set(false);
    this.showActivityOptions.set(false);
    this.form.patchValue({
      userId: 0,
      amount: null,
      paymentMethod: PaymentMethod.CASH,
      activityId: 0,
      tokens: null,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  protected setUserSearch(value: string): void {
    this.userQuery.set(value);
    this.showUserOptions.set(true);
    this.form.patchValue({ userId: 0 });
  }

  protected setActivitySearch(value: string): void {
    this.activityQuery.set(value);
    this.showActivityOptions.set(true);
    this.form.patchValue({ activityId: 0 });
  }

  protected openUserSelector(): void {
    this.showUserOptions.set(true);
  }

  protected closeUserSelector(): void {
    setTimeout(() => this.showUserOptions.set(false), 120);
  }

  protected selectUser(userId: number): void {
    const user = this.users().find((item) => item.id === userId);
    this.form.patchValue({ userId });
    this.userQuery.set(user ? `${user.name} ${user.lastName} (${user.email})` : '');
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
    this.form.patchValue({ activityId });
    this.activityQuery.set(activity?.name ?? '');
    this.showActivityOptions.set(false);
  }

  protected activityName(activityId: number): string {
    return (
      this.activities().find((activity) => activity.id === activityId)?.name ??
      `Actividad #${activityId}`
    );
  }

  protected async createPaymentAndPackage(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const userId = this.form.controls.userId.value;
    const activityId = this.form.controls.activityId.value;
    const tokens = Number(this.form.controls.tokens.value);
    const amount = Number(this.form.controls.amount.value);
    const paymentMethod = this.form.controls.paymentMethod.value;

    const paymentPayload: CreatePaymentRequest = {
      amount: amount.toFixed(2),
      paymentMethod,
      clientId: userId,
      headquartersId: this.headquartersId,
      organizationId: 1,
    };

    try {
      const payment = await firstValueFrom(this.paymentsApi.create(paymentPayload));
      await firstValueFrom(
        this.clientPackagesApi.create(userId, {
          paymentId: payment.id,
          activityTokens: { [String(activityId)]: tokens },
        }),
      );

      const user = this.users().find((item) => item.id === userId);
      this.createdPayments.update((current) => [
        {
          paymentId: payment.id,
          amount: payment.amount,
          paymentMethod: String(payment.paymentMethod),
          paidAt: payment.paidAt,
          userName: user ? `${user.name} ${user.lastName}` : `Usuario #${userId}`,
          activityName: this.activityName(activityId),
          tokens,
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
    return {
      paymentId: item.id,
      amount: item.amount,
      paymentMethod: String(item.paymentMethod),
      paidAt: item.paidAt,
      userName: `${item.userName} ${item.userLastName}`,
    };
  }
}
