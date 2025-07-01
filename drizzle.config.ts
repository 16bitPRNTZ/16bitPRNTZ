import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Ensure environment variables are loaded

export default {
  schema: './.server/db/schema.ts', // Path to your schema file
  out: './drizzle',             // Directory for migrations
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Your Supabase connection string
  },
} satisfies Config;