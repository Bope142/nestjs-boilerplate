import { defineConfig } from 'drizzle-kit';
import { resolveDatabaseUrl } from './src/database/database-url';

export default defineConfig({
  schema: './src/database/schema/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});
