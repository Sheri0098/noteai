import { User } from '../types';

export const createUserProfile = (email: string, name?: string): User => {
  const prefix = (email.split('@')[0] || 'user').trim();
  const fallbackName = prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'User';
  const normalizedName = (name || fallbackName).trim() || 'User';

  return {
    name: normalizedName,
    email,
    avatar: '',
    plan: 'Free',
  };
};
