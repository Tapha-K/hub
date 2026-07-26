import { beforeEach, expect, test, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  global.fetch = vi.fn();
});

test('uses the login session and csrf token without sending a client user id', async () => {
  fetch
    .mockResolvedValueOnce(response({
      user: { id: 7, nickname: '다정' },
      csrfToken: 'csrf-token',
    }))
    .mockResolvedValueOnce(response({ id: 10, title: '책' }));

  const { createBook, loginWithGoogle } = await import('./api');
  await loginWithGoogle('google-id-token');
  await createBook({ providerId: 'volume-1', initialPage: 1 });

  const [, options] = fetch.mock.calls[1];
  expect(options.credentials).toBe('include');
  expect(options.headers['X-CSRF-Token']).toBe('csrf-token');
  expect(JSON.parse(options.body)).toEqual({ providerId: 'volume-1', initialPage: 1 });
});

function response(body) {
  return {
    ok: true,
    json: async () => body,
  };
}
