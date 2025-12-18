import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        isolatedStorage: false,
        wrangler: { configPath: './wrangler.json' },
        miniflare: {
          // Add any bindings needed for tests
          bindings: {
            // We'll set this in our tests
            SERPER_API_KEY: 'test-key',
            BEARER_TOKEN: 'test-token',
          },
        },
      },
    },
    include: ['src/tests/basic.test.ts'],
  },
});
