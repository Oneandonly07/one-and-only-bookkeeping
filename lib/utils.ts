// lib/utils.ts

// Uniform action result shapes used across server actions & API routes
export type Ok<T = any> = { status: 'ok'; data?: T };
export type Err = { status: 'error'; message?: string };

// Success
export function ok<T = any>(data?: T): Ok<T> {
  return { status: 'ok', data };
}

// Generic error
export function err(message?: string): Err {
  return { status: 'error', message };
}

// Convenience alias when you want to signal a 400-style failure
export function badRequest(message?: string): Err {
  return { status: 'error', message: message ?? 'Bad request' };
}
