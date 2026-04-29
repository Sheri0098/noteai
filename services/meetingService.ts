import { supabase } from '../lib/supabase';
import {
  ActionItem,
  Meeting,
  MeetingDetailsPayload,
  ProcessUploadRequest,
  ProcessUploadResponse,
  ProcessTextRequest,
  ProcessTextResponse,
  UsageSummary,
} from '../types';
import { apiRequest } from './apiClient';
import { MeetingRow } from '../types/database';
import { isSupabaseConfigured } from '../lib/config';

const nowDate = () => new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const isoNow = () => new Date().toISOString();
const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
const ensureMeetingConfig = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
};

const toMeeting = (row: MeetingRow): Meeting => ({
  id: row.id,
  title: row.title || 'Untitled meeting',
  date: row.meeting_date || nowDate(),
  time: row.meeting_time || nowTime(),
  duration: row.duration || '0m',
  source: row.source || 'Upload',
  status: row.status || 'Processing',
  participants: row.participants || [],
  summarySnippet: row.summary_snippet || '',
  actionItemsCount: row.action_items_count || 0,
  actionItemsCompleted: row.action_items_completed || 0,
});

export const meetingService = {
  async getProfile(): Promise<{ fullName: string; bio: string; avatarUrl: string }> {
    ensureMeetingConfig();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to view profile.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, bio, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      fullName: data?.full_name || '',
      bio: data?.bio || '',
      avatarUrl: data?.avatar_url || '',
    };
  },

  async updateProfile(data: { fullName: string; bio: string; avatarUrl?: string }): Promise<void> {
    ensureMeetingConfig();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to update profile.');
    }

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: data.fullName,
        bio: data.bio,
        avatar_url: data.avatarUrl ?? '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      throw new Error(error.message);
    }
  },

  async getUsageSummary(): Promise<UsageSummary> {
    try {
      ensureMeetingConfig();
      const result = await apiRequest<UsageSummary>('/billing/usage');
      return result;
    } catch {
      // Return default free plan if API fails
      // This prevents processing from being blocked
      return {
        plan: 'Free',
        usedMinutes: 0,
        limitMinutes: 120,
      };
    }
  },

  async canStartProcessing(estimatedMinutes = 30): Promise<{ allowed: boolean; usage: UsageSummary }> {
    const usage = await this.getUsageSummary();
    if (usage.limitMinutes === null) {
      return { allowed: true, usage };
    }
    return {
      allowed: usage.usedMinutes + estimatedMinutes <= usage.limitMinutes,
      usage,
    };
  },

  async listMeetings(): Promise<Meeting[]> {
    ensureMeetingConfig();

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data || []) as MeetingRow[]).map(toMeeting);
  },

  async getMeetingDetails(meetingId: string): Promise<MeetingDetailsPayload> {
    ensureMeetingConfig();

    const { data, error } = await supabase
      .from('meetings')
      .select('id, title, meeting_date, meeting_time, summary_snippet, full_transcript, action_items')
      .eq('id', meetingId)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Meeting not found');
    }

    const row = data as MeetingRow;
    return {
      id: row.id,
      title: row.title || 'Untitled meeting',
      date: row.meeting_date || nowDate(),
      time: row.meeting_time || nowTime(),
      status: row.status || 'Processing',
      summarySnippet: row.summary_snippet || '',
      fullTranscript: row.full_transcript || '',
      actionItems: ((row.action_items as ActionItem[]) || []),
    };
  },

  async createFromTranscript(payload: ProcessTextRequest): Promise<ProcessTextResponse> {
    ensureMeetingConfig();

    return apiRequest<ProcessTextResponse>('/meetings/process-text', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createFromUpload(payload: ProcessUploadRequest): Promise<ProcessUploadResponse> {
    ensureMeetingConfig();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to upload meetings.');
    }

    const fileName = payload.file.name && 
      payload.file.name !== 'blob' 
      ? sanitizeFileName(payload.file.name)
      : `recording-${Date.now()}.webm`;
    const filePath = `${user.id}/${fileName}`;
    const uploadResult = await supabase.storage
      .from('meeting-audio')
      .upload(filePath, payload.file, {
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    try {
      return await apiRequest<ProcessUploadResponse>('/meetings/process-upload', {
        method: 'POST',
        body: JSON.stringify({
          storagePath: filePath,
          title: payload.title,
          meetingDate: payload.meetingDate,
        }),
      });
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to process upload'
      );
    }
  },

  async regenerateSummary(meetingId: string, transcript: string): Promise<string> {
    ensureMeetingConfig();

    const data = await apiRequest<{ summary: string }>('/ai/regenerate-summary', {
      method: 'POST',
      body: JSON.stringify({ meetingId, transcript }),
    });
    return data.summary;
  },

  async askMeetingQuestion(meetingId: string, question: string): Promise<string> {
    ensureMeetingConfig();

    const data = await apiRequest<{ answer: string }>('/ai/meeting-chat', {
      method: 'POST',
      body: JSON.stringify({ meetingId, question }),
    });
    return data.answer;
  },

  async updateActionItems(meetingId: string, items: ActionItem[]): Promise<void> {
    if (!meetingId) {
      return;
    }

    ensureMeetingConfig();

    const completed = items.filter((item) => item.status === 'Done').length;
    try {
      await apiRequest('/meetings/update-action-items', {
        method: 'POST',
        body: JSON.stringify({
          meetingId,
          actionItems: items,
          actionItemsCount: items.length,
          actionItemsCompleted: completed,
        }),
      });
      return;
    } catch {
      const { error } = await supabase
        .from('meetings')
        .update({
          action_items: items,
          action_items_count: items.length,
          action_items_completed: completed,
        })
        .eq('id', meetingId);

      if (error) {
        throw new Error(error.message);
      }
    }
  },

  async upgradePlan(plan: string): Promise<void> {
    try {
      ensureMeetingConfig();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: plan,
          limit_minutes: plan === 'Free' ? 120 : null,
          used_minutes: 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch {
      // silently fail
    }
  },

  async deleteMeeting(meetingId: string): Promise<void> {
    if (!meetingId) {
      return;
    }

    ensureMeetingConfig();

    try {
      await apiRequest('/meetings/delete', {
        method: 'POST',
        body: JSON.stringify({ meetingId }),
      });
      return;
    } catch {
      const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
      if (error) {
        throw new Error(error.message);
      }
    }
  },
};
