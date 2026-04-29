import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const serverConfig = {
  port: Number(process.env.API_PORT || 4000),
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  openaiApiKey: required('OPENAI_API_KEY'),
  openaiSummaryModel: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  openaiTranscriptionModel: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
