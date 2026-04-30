const getEnv = (key: string): string => {
  const value = (import.meta as any).env?.[key];
  return typeof value === 'string' ? value : '';
};

export const config = {
  supabaseUrl: getEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
};

export const isSupabaseConfigured =
  Boolean(config.supabaseUrl) && Boolean(config.supabaseAnonKey);
