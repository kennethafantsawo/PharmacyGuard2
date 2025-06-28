import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.SUPABASE_CONNECTION_STRING) {
  throw new Error(
    "SUPABASE_CONNECTION_STRING must be set. Get it from your Supabase dashboard.",
  );
}

const connectionString = process.env.SUPABASE_CONNECTION_STRING;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Client Supabase pour les features avancées
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);