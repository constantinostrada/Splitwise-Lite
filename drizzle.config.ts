import type { Config } from 'drizzle-kit';

const dbUrl = process.env.DATABASE_URL ?? './data/splitwise.db';

export default {
  schema: './src/infrastructure/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
} satisfies Config;
