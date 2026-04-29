import { config } from '../lib/config';
import { supabase } from '../lib/supabase';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const session = supabase ? await supabase.auth.getSession() : null;
  const accessToken = session?.data?.session?.access_token;

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error (${response.status})`);
  }

  return (await response.json()) as T;
}
