import 'server-only';

/**
 * Stable, human-safe error codes. UI and clients can branch on `code`
 * without parsing message text. Never include secrets, SQL, or stack traces
 * in a thrown AppError's `message` — that is what gets sent to clients.
 */
export type AppErrorCode =
  | 'UNAUTHORIZED' | 'FORBIDDEN' | 'ORG_NOT_FOUND' | 'ORG_SUSPENDED' | 'MEMBER_DEACTIVATED'
  | 'SERVICE_DISABLED' | 'PLAN_LIMIT_REACHED' | 'INVITE_EXPIRED' | 'INVITE_REVOKED' | 'DUPLICATE_MEMBER'
  | 'BILLING_NOT_CONFIGURED' | 'PAYMENT_FAILED' | 'NOT_FOUND' | 'BAD_REQUEST' | 'CONFLICT';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  constructor(code: AppErrorCode, message: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export function appError(code: AppErrorCode, message: string, status = 400): AppError {
  return new AppError(code, message, status);
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

/** Map an unknown thrown error to a client-safe { error, code } payload. */
export function toSafeError(e: unknown, fallback = 'Something went wrong. Please try again.'): { error: string; code: string } {
  if (e instanceof AppError) return { error: e.message, code: e.code };
  return { error: fallback, code: 'BAD_REQUEST' };
}
