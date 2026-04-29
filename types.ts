export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  source: 'Zoom' | 'Meet' | 'Teams' | 'Live' | 'Upload' | 'In-Person';
  status: 'Done' | 'Processing' | 'Scheduled';
  participants: string[]; // URLs to avatars
  summarySnippet: string;
  actionItemsCount: number;
  actionItemsCompleted: number;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  assigneeAvatar?: string; // Color or Image URL
  dueDate: string;
  status: 'Done' | 'In Progress' | 'Pending';
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerInitials: string;
  speakerColor: string;
  time: string;
  text: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  plan: 'Free' | 'Pro' | 'Business';
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: User;
}

export interface SignupResult {
  user: AuthUser;
  needsConfirmation: boolean;
}

export interface ProcessTextRequest {
  transcript: string;
  title?: string;
}

export interface ProcessTextResponse {
  meetingId: string;
}

export interface ProcessUploadRequest {
  file: File;
  title?: string;
  meetingDate?: string;
}

export interface ProcessUploadResponse {
  meetingId: string;
}

export interface UsageSummary {
  plan: User['plan'];
  usedMinutes: number;
  limitMinutes: number | null;
}

export interface MeetingDetailsPayload {
  id: string;
  title: string;
  date: string;
  time: string;
  status?: Meeting['status'];
  summarySnippet: string;
  fullTranscript: string;
  actionItems: ActionItem[];
}