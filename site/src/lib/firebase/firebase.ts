import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

// Your Supabase configuration - replace with your actual config
const supabaseUrl = 'https://agfcrdzsgvfoinejjuco.supabase.co';
const supabaseAnonKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZmNyZHpzZ3Zmb2luZWpqdWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjM0MDcsImV4cCI6MjA1NzUzOTQwN30.uP8-jcnZD3boWtoLeQANWJq9nrTgsBFFbucf-tw20xg';

// Initialize Supabase with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
