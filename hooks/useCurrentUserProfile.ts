import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { meetingService } from '../services/meetingService';
import { User } from '../types';

const defaultUser: User = {
  name: 'User',
  email: 'user@noteai.app',
  avatar: '',
  plan: 'Free',
};

export const PROFILE_UPDATED_EVENT = 'profile-updated';

export const useCurrentUserProfile = (): User => {
  const { user } = useAuth();
  const [profileVersion, setProfileVersion] = useState(0);
  const [profileData, setProfileData] = useState<{
    fullName: string;
    bio: string;
    avatarUrl: string;
  } | null>(null);

  useEffect(() => {
    const onProfileUpdated = () => setProfileVersion((v) => v + 1);
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setProfileData(null);
      return;
    }

    let cancelled = false;
    meetingService
      .getProfile()
      .then((p) => {
        if (!cancelled) setProfileData(p);
      })
      .catch(() => {
        if (!cancelled) setProfileData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.id, profileVersion]);

  return useMemo(() => {
    if (user?.email) {
      const prefix = user.email.split('@')[0] || 'user';
      const fallbackName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      const name = profileData?.fullName?.trim() || user.profile?.name?.trim() || fallbackName;
      const url = profileData?.avatarUrl?.trim() || '';
      const avatar = url || name.charAt(0).toUpperCase();
      return {
        name,
        email: user.email,
        avatar,
        plan: user.profile?.plan || 'Free',
      };
    }
    return defaultUser;
  }, [user, profileData]);
};
