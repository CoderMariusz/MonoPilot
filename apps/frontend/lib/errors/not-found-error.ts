/**
 * NotFoundError
 * Story: 01.1 - Org Context + Base RLS
 * HTTP Status: 404
 *
 * IMPORTANT: Use 404 (not 403) for cross-tenant access
 * to prevent existence enumeration attacks (AC-02, AC-03)
 */

import { AppError } from './app-error'

export class NotFoundError extends AppError {
  readonly statusCode = 404

  constructor(message: string = 'Not found') {
    super(message)
  }
}
