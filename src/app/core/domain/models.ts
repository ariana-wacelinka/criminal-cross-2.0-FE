export type IsoInstant = string;
export type IsoDate = string;
export type IsoTime = string;

export enum SchedulerType {
  WEEKLY_RANGE = 'WEEKLY_RANGE',
  ONE_TIME_DISPOSABLE = 'ONE_TIME_DISPOSABLE',
}

export enum SessionTemplateType {
  WEEKLY_RANGE = 'WEEKLY_RANGE',
  ONE_TIME = 'ONE_TIME',
  ONE_TIME_DISPOSABLE = 'ONE_TIME_DISPOSABLE',
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum WaitlistStrategy {
  FIFO = 'FIFO',
}

export enum SessionSource {
  MANUAL = 'MANUAL',
  SCHEDULER = 'SCHEDULER',
}

export enum SessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  WAITLISTED = 'WAITLISTED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
}

export enum BillingManagedBy {
  HQ = 'HQ',
  ORG = 'ORG',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

export enum Role {
  CLIENT = 'CLIENT',
  PROFESSOR = 'PROFESSOR',
  ORG_ADMIN = 'ORG_ADMIN',
  ORG_OWNER = 'ORG_OWNER',
  SUPERADMIN = 'SUPERADMIN',
}

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google.com',
  FACEBOOK = 'facebook.com',
}

export interface SessionConfiguration {
  maxParticipants: number;
  waitlistEnabled: boolean;
  waitlistMaxSize: number;
  waitlistStrategy: WaitlistStrategy;
  cancellationMinHoursBeforeStart: number;
  cancellationAllowLateCancel: boolean;
}

export interface Activity {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  hqId: number;
}

export interface ActivitySchedule {
  id: number;
  organizationId: number;
  headquartersId: number;
  activityId: number;
  dayOfWeek?: number;
  weekDays?: WeekDay[];
  startTime: IsoTime;
  durationMinutes: number;
  active: boolean;
  schedulerType: SchedulerType;
  templateType: SessionTemplateType;
  activeFrom?: IsoDate;
  activeUntil?: IsoDate;
  scheduledDate?: IsoDate;
}

export interface Headquarters {
  id: number;
  organizationId: number;
  name: string;
  activities?: Activity[];
  organization?: Organization;
}

export interface Organization {
  id: number;
  name: string;
  headquarters?: Headquarters[];
}

export interface SessionInstance {
  id: number;
  organizationId: number;
  headquartersId: number;
  activityId: number;
  startsAt: IsoInstant;
  endsAt: IsoInstant;
  status: SessionStatus;
  source: SessionSource;
  maxParticipants: number;
  waitlistEnabled: boolean;
  waitlistMaxSize: number;
  waitlistStrategy: WaitlistStrategy;
  cancellationMinHoursBeforeStart: number;
  cancellationAllowLateCancel: boolean;
}

export interface ClientPackageCredit {
  activityId: number;
  tokens: number;
}

export interface ClientPackage {
  id: number;
  userId: number;
  paymentId: number;
  periodStart: IsoDate;
  periodEnd: IsoDate;
  active: boolean;
  credits: ClientPackageCredit[];
}

export interface Booking {
  id: number;
  sessionId: number;
  userId: number;
  status: BookingStatus;
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
  cancelledAt?: IsoInstant;
  createRequestId?: string;
  cancelRequestId?: string;
  promotedBookingId?: number;
  consumedPackageId?: number;
}

export interface Payment {
  id: number;
  amount: string;
  paymentMethod: PaymentMethod | string;
  paidAt: IsoDate;
}

export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  firebaseUid: string;
  roles: Role[];
  active: boolean;
}

export interface AuthenticatedUser {
  firebaseUid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  provider: AuthProvider;
  userId: number;
  roles: Role[];
  active: boolean;
}

export interface RefreshToken {
  id: number;
  token: string;
  firebaseUid: string;
  userId: number;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: IsoInstant;
  expiresAt: IsoInstant;
  revoked: boolean;
  revokedAt?: IsoInstant;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface ActivityPageResponse {
  content: Activity[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SessionPageResponse {
  items: SessionInstance[];
  page: number;
  limit: number;
  total: number;
}

export interface BookingPageResponse {
  items: Booking[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
