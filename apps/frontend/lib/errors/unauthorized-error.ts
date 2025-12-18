/**
 * UnauthorizedError
 * Story: 01.1 - Org Context + Base RLS
 * HTTP Status: 401
 */

import { AppError } from './app-error'

export class UnauthorizedError extends AppError {
  readonly statusCode = 401

  constructor(message: string = 'Unauthorized') {
    super(message)
  }
}
