const getEnv = (key: string): string => {
  const value = (import.meta as any).env?.[key];
  return typeof value === 'string' ? value : '';
};

// Determine API base URL
const getApiBaseUrl = (): string => {
  // Check environment variable first
  const envUrl = getEnv('VITE_API_BASE_URL');
  if (envUrl) return envUrl;
  
  // Fallback based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }
    // Production — use Railway URL directly
    return 'https://noteai-production.up.railway.app/api';
  }
  
  return '/api';
};

export const config = {
  supabaseUrl: getEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
  apiBaseUrl: getApiBaseUrl(),
};

export const isSupabaseConfigured =
  Boolean(config.supabaseUrl) && Boolean(config.supabaseAnonKey);
