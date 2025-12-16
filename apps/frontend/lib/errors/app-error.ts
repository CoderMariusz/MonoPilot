/**
 * Base Application Error
 * Story: 01.1 - Org Context + Base RLS
 *
 * Base class for all application errors with HTTP status codes
 */

export abstract class AppError extends Error {
  abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
