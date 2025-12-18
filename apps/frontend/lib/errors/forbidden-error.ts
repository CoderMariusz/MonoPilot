/**
 * ForbiddenError
 * Story: 01.1 - Org Context + Base RLS
 * HTTP Status: 403
 *
 * Use for permission/role checks, NOT for cross-tenant access
 * (cross-tenant must return 404 to prevent enumeration)
 */

import { AppError } from './app-error'

export class ForbiddenError extends AppError {
  readonly statusCode = 403

  constructor(message: string = 'Forbidden') {
    super(message)
  }
}
