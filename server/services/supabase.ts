import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Please set it in your environment variables.");
}

// Create postgres connection with optimized settings
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 5,
  max_lifetime: 300,
  transform: postgres.camel
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Supabase configuration
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client for server operations
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
import 'dotenv/config';
