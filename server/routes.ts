import { Router } from 'express';
import { z } from 'zod';
import { answerMeetingQuestion, analyzeTranscript, regenerateSummary, transcribeAudio } from './ai';
import { AuthenticatedRequest } from './auth';
import { supabaseAdmin } from './supabase';

const router = Router();

const defaultPlan = { plan: 'Free', limitMinutes: 120 };

const ensureSubscription = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, plan, used_minutes, limit_minutes')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: defaultPlan.plan,
        used_minutes: 0,
        limit_minutes: defaultPlan.limitMinutes,
      })
      .select('user_id, plan, used_minutes, limit_minutes')
      .single();
    if (insertError || !inserted) throw new Error(insertError?.message || 'Failed to create subscription');
    return inserted;
  }

  return data;
};

const assertQuota = async (userId: string, estimatedMinutes: number) => {
  const sub = await ensureSubscription(userId);
  if (sub.limit_minutes === null) {
    return sub;
  }
  const used = Number(sub.used_minutes || 0);
  const limit = Number(sub.limit_minutes || 0);
  if (used + estimatedMinutes > limit) {
    const err = new Error('Quota exceeded');
    (err as any).statusCode = 403;
    throw err;
  }
  return sub;
};

const addUsage = async (userId: string, minutes: number, source: string) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  if (!safeMinutes) return;

  const sub = await ensureSubscription(userId);
  const nextUsed = Number(sub.used_minutes || 0) + safeMinutes;
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ used_minutes: nextUsed })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from('usage_events').insert({
    user_id: userId,
    minutes: safeMinutes,
    source,
    created_at: new Date().toISOString(),
  });
};

const ensureOwnership = async (meetingId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .select('id, user_id, full_transcript')
    .eq('id', meetingId)
    .single();
  if (error || !data) throw new Error(error?.message || 'Meeting not found');
  if (data.user_id !== userId) {
    const err = new Error('Forbidden');
    (err as any).statusCode = 403;
    throw err;
  }
  return data;
};

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.get('/ops/self-check', async (_req, res) => {
  const result = {
    ok: true,
    checks: {
      tables: {
        meetings: false,
        subscriptions: false,
        usage_events: false,
      },
      storage: {
        meeting_audio_bucket: false,
      },
      ai: {
        openai_key_present: false,
      },
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const meetingsCheck = await supabaseAdmin.from('meetings').select('id').limit(1);
    result.checks.tables.meetings = !meetingsCheck.error;

    const subsCheck = await supabaseAdmin.from('subscriptions').select('user_id').limit(1);
    result.checks.tables.subscriptions = !subsCheck.error;

    const usageCheck = await supabaseAdmin.from('usage_events').select('id').limit(1);
    result.checks.tables.usage_events = !usageCheck.error;

    const buckets = await supabaseAdmin.storage.listBuckets();
    result.checks.storage.meeting_audio_bucket = Boolean(
      buckets.data?.some((bucket) => bucket.name === 'meeting-audio')
    );

    result.checks.ai.openai_key_present = Boolean(process.env.OPENAI_API_KEY);

    const tableOk =
      result.checks.tables.meetings &&
      result.checks.tables.subscriptions &&
      result.checks.tables.usage_events;
    const storageOk = result.checks.storage.meeting_audio_bucket;
    const aiOk = result.checks.ai.openai_key_present;
    result.ok = tableOk && storageOk && aiOk;

    return res.status(result.ok ? 200 : 503).json(result);
  } catch (error) {
    result.ok = false;
    return res.status(500).json({
      ...result,
      error: error instanceof Error ? error.message : 'Self-check failed',
    });
  }
});

router.get('/billing/usage', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const sub = await ensureSubscription(userId);
    res.json({
      plan: sub.plan || 'Free',
      usedMinutes: Number(sub.used_minutes || 0),
      limitMinutes: sub.limit_minutes === null ? null : Number(sub.limit_minutes),
    });
  } catch (error) {
    res.status(500).send(error instanceof Error ? error.message : 'Failed to read usage');
  }
});

router.post('/meetings/process-text', async (req, res) => {
  const schema = z.object({
    transcript: z.string().min(10),
    title: z.string().optional(),
  });

  try {
    const userId = (req as AuthenticatedRequest).userId;
    const parsed = schema.parse(req.body);
    const estimatedMinutes = Math.max(1, Math.ceil(parsed.transcript.split(/\s+/).length / 150));
    await assertQuota(userId, 5);

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('meetings')
      .insert({
        user_id: userId,
        title: parsed.title || 'Processing transcript',
        meeting_date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        meeting_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        source: 'Upload',
        status: 'Processing',
        full_transcript: parsed.transcript,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      return res.status(500).send(insertError?.message || 'Failed to create meeting');
    }

    const analysis = await analyzeTranscript(parsed.transcript, parsed.title);
    const doneStatus = analysis.summarySnippet ? 'Done' : 'Processing';
    const completedItems = analysis.actionItems.filter((item) => item.status === 'Done').length;

    await supabaseAdmin
      .from('meetings')
      .update({
        title: analysis.title,
        summary_snippet: analysis.summarySnippet,
        action_items: analysis.actionItems,
        action_items_count: analysis.actionItems.length,
        action_items_completed: completedItems,
        status: doneStatus,
        duration: `${analysis.durationMinutes || estimatedMinutes}m`,
      })
      .eq('id', inserted.id);

    await addUsage(userId, analysis.durationMinutes || estimatedMinutes, 'text');
    res.json({ meetingId: inserted.id });
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 400;
    res.status(statusCode).send(error instanceof Error ? error.message : 'Failed to process transcript');
  }
});

router.post('/meetings/process-upload', async (req, res) => {
  const schema = z.object({
    storagePath: z.string().min(1),
    title: z.string().optional(),
    meetingDate: z.string().optional(),
  });

  try {
    const userId = (req as AuthenticatedRequest).userId;
    const parsed = schema.parse(req.body);
    await assertQuota(userId, 5); // minimum check

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('meetings')
      .insert({
        user_id: userId,
        title: parsed.title || 'Processing upload',
        meeting_date:
          parsed.meetingDate ||
          new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        meeting_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        source: 'Upload',
        status: 'Processing',
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      return res.status(500).send(insertError?.message || 'Failed to create meeting');
    }

    const download = await supabaseAdmin.storage.from('meeting-audio').download(parsed.storagePath);
    if (download.error || !download.data) {
      return res.status(500).send(download.error?.message || 'Failed to download uploaded file');
    }

    const fileBlob = download.data;
    const file = new File([fileBlob], parsed.storagePath.split('/').pop() || 'upload.webm', {
      type: fileBlob.type || 'audio/webm',
    });

    const transcript = await transcribeAudio(file);
    const analysis = await analyzeTranscript(transcript, parsed.title);
    const durationMinutes = analysis.durationMinutes || 30;
    const completedItems = analysis.actionItems.filter((item) => item.status === 'Done').length;

    await supabaseAdmin
      .from('meetings')
      .update({
        title: analysis.title || parsed.title || 'Uploaded meeting',
        full_transcript: transcript,
        summary_snippet: analysis.summarySnippet,
        action_items: analysis.actionItems,
        action_items_count: analysis.actionItems.length,
        action_items_completed: completedItems,
        duration: `${durationMinutes}m`,
        status: 'Done',
      })
      .eq('id', inserted.id);

    await addUsage(userId, durationMinutes, 'upload');
    res.json({ meetingId: inserted.id });
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 400;
    res.status(statusCode).send(error instanceof Error ? error.message : 'Failed to process upload');
  }
});

router.post('/ai/regenerate-summary', async (req, res) => {
  const schema = z.object({
    meetingId: z.string().min(1),
    transcript: z.string().min(1),
  });
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const parsed = schema.parse(req.body);
    await ensureOwnership(parsed.meetingId, userId);
    const summary = await regenerateSummary(parsed.transcript);
    await supabaseAdmin.from('meetings').update({ summary_snippet: summary }).eq('id', parsed.meetingId);
    res.json({ summary });
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 400;
    res.status(statusCode).send(error instanceof Error ? error.message : 'Failed to regenerate summary');
  }
});

router.post('/ai/meeting-chat', async (req, res) => {
  const schema = z.object({
    meetingId: z.string().min(1),
    question: z.string().min(1),
  });
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const parsed = schema.parse(req.body);
    const meeting = await ensureOwnership(parsed.meetingId, userId);
    const answer = await answerMeetingQuestion(meeting.full_transcript || '', parsed.question);
    res.json({ answer });
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 400;
    res.status(statusCode).send(error instanceof Error ? error.message : 'Failed to answer question');
  }
});

router.post('/meetings/update-action-items', async (req, res) => {
  const schema = z.object({
    meetingId: z.string().min(1),
    actionItems: z.array(z.object({
      id: z.string(),
      text: z.string(),
      assignee: z.string(),
      dueDate: z.string(),
      status: z.enum(['Pending', 'In Progress', 'Done']),
      assigneeAvatar: z.string().optional(),
    })),
    actionItemsCount: z.number().int().nonnegative(),
    actionItemsCompleted: z.number().int().nonnegative(),
  });

  try {
    const userId = (req as AuthenticatedRequest).userId;
    const parsed = schema.parse(req.body);
    await ensureOwnership(parsed.meetingId, userId);

    const { error } = await supabaseAdmin
      .from('meetings')
      .update({
        action_items: parsed.actionItems,
        action_items_count: parsed.actionItemsCount,
        action_items_completed: parsed.actionItemsCompleted,
      })
      .eq('id', parsed.meetingId);

    if (error) return res.status(500).send(error.message);
    res.json({ ok: true });
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 400;
    res.status(statusCode).send(error instanceof Error ? error.message : 'Failed to update action items');
  }
});

router.post('/meetings/delete', async (req, res) => {
  const schema = z.object({
    meetingId: z.string().min(1),
  });
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const parsed = schema.parse(req.body);
    await ensureOwnership(parsed.meetingId, userId);
    const { error } = await supabaseAdmin.from('meetings').delete().eq('id', parsed.meetingId);
    if (error) return res.status(500).send(error.message);
    res.json({ ok: true });
  } catch (error) {
    const statusCode = (error as any)?.statusCode || 400;
    res.status(statusCode).send(error instanceof Error ? error.message : 'Failed to delete meeting');
  }
});

export default router;
