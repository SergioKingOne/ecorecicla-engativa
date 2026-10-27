import { vi } from 'vitest';

/** Shared mock for the API client module, injected with vi.mock in each test. */
export const apiMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

export function mockApiModule() {
  return {
    api: apiMock,
    getToken: () => null,
    getStoredUser: () => null,
    saveSession: vi.fn(),
    clearSession: vi.fn(),
    ApiError: class ApiError extends Error {},
  };
}
