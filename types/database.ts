export interface MeetingRow {
  id: string;
  title: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  duration: string | null;
  source: 'Zoom' | 'Meet' | 'Teams' | 'Live' | 'Upload' | 'In-Person' | null;
  status: 'Done' | 'Processing' | 'Scheduled' | null;
  participants: string[] | null;
  summary_snippet: string | null;
  action_items_count: number | null;
  action_items_completed: number | null;
  full_transcript?: string | null;
  action_items?: unknown;
  created_at?: string | null;
}
