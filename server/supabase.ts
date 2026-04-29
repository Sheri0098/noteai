import { createClient } from '@supabase/supabase-js';
import { serverConfig } from './config';

export const supabaseAdmin = createClient(
  serverConfig.supabaseUrl,
  serverConfig.supabaseServiceRoleKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

export const supabaseAnon = createClient(
  serverConfig.supabaseUrl,
  serverConfig.supabaseAnonKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);
