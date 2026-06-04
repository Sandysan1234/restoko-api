import { HTTPException } from 'hono/http-exception'

/**
 * 404 — Resource not found
 */
export class NotFoundError extends HTTPException {
  constructor(resource = 'Resource') {
    super(404, { message: `${resource} not found` })
    this.name = 'NotFoundError'
  }
}

/**
 * 401 — Missing or invalid session / token
 */
export class UnauthorizedError extends HTTPException {
  constructor(message = 'Unauthorized') {
    super(401, { message })
    this.name = 'UnauthorizedError'
  }
}

/**
 * 403 — Authenticated but insufficient permissions
 */
export class ForbiddenError extends HTTPException {
  constructor(message = 'Forbidden') {
    super(403, { message })
    this.name = 'ForbiddenError'
  }
}

/**
 * 409 — Conflicting resource (e.g. duplicate email)
 */
export class ConflictError extends HTTPException {
  constructor(message = 'Conflict') {
    super(409, { message })
    this.name = 'ConflictError'
  }
}

/**
 * 422 — Validation failure with field-level details
 */
export class ValidationError extends HTTPException {
  public readonly details: { field: string; message: string }[]

  constructor(details: { field: string; message: string }[]) {
    super(422, { message: 'Validation failed' })
    this.name = 'ValidationError'
    this.details = details
  }
}

/**
 * 400 — Generic bad request
 */
export class BadRequestError extends HTTPException {
  constructor(message = 'Bad request') {
    super(400, { message })
    this.name = 'BadRequestError'
  }
}
