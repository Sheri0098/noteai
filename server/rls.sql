-- Enable Row Level Security and define per-user access policies.
-- Run this after schema.sql in Supabase SQL editor.

alter table public.meetings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;

-- Meetings: users can only access their own rows.
drop policy if exists meetings_select_own on public.meetings;
create policy meetings_select_own
on public.meetings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists meetings_insert_own on public.meetings;
create policy meetings_insert_own
on public.meetings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists meetings_update_own on public.meetings;
create policy meetings_update_own
on public.meetings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists meetings_delete_own on public.meetings;
create policy meetings_delete_own
on public.meetings
for delete
to authenticated
using (auth.uid() = user_id);

-- Subscriptions: users can read/update only their own subscription row.
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists subscriptions_insert_own on public.subscriptions;
create policy subscriptions_insert_own
on public.subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists subscriptions_update_own on public.subscriptions;
create policy subscriptions_update_own
on public.subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Usage events: users can read only their own events.
drop policy if exists usage_events_select_own on public.usage_events;
create policy usage_events_select_own
on public.usage_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists usage_events_insert_own on public.usage_events;
create policy usage_events_insert_own
on public.usage_events
for insert
to authenticated
with check (auth.uid() = user_id);

-- Storage bucket and policies for meeting audio uploads.
insert into storage.buckets (id, name, public)
values ('meeting-audio', 'meeting-audio', false)
on conflict (id) do nothing;

drop policy if exists storage_meeting_audio_select_own on storage.objects;
create policy storage_meeting_audio_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_meeting_audio_insert_own on storage.objects;
create policy storage_meeting_audio_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_meeting_audio_update_own on storage.objects;
create policy storage_meeting_audio_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_meeting_audio_delete_own on storage.objects;
create policy storage_meeting_audio_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'meeting-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage bucket and policies for avatar image uploads.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists storage_avatars_select_public on storage.objects;
create policy storage_avatars_select_public
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists storage_avatars_insert_own on storage.objects;
create policy storage_avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_avatars_update_own on storage.objects;
create policy storage_avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_avatars_delete_own on storage.objects;
create policy storage_avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
