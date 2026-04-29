import OpenAI from 'openai';
import { serverConfig } from './config';

const openai = new OpenAI({
  apiKey: serverConfig.openaiApiKey,
  baseURL: 'https://api.groq.com/openai/v1',
});

export interface GeneratedActionItem {
  id: string;
  text: string;
  assignee: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Done';
}

export interface MeetingAnalysis {
  title: string;
  summarySnippet: string;
  actionItems: GeneratedActionItem[];
  durationMinutes?: number;
}

const cleanJson = (content: string): string =>
  content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

export const transcribeAudio = async (file: File): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: serverConfig.openaiTranscriptionModel,
    response_format: 'text',
  });
  return transcription.text || '';
};

export const analyzeTranscript = async (
  transcript: string,
  titleHint?: string
): Promise<MeetingAnalysis> => {
  const completion = await openai.chat.completions.create({
    model: serverConfig.openaiSummaryModel,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You analyze meeting transcripts and return strict JSON only. Keep summary concise. Extract realistic action items.',
      },
      {
        role: 'user',
        content: `Return JSON with keys: title, summarySnippet, actionItems (array of {id,text,assignee,dueDate,status}), durationMinutes.\nTitle hint: ${
          titleHint || 'none'
        }\nTranscript:\n${transcript}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(cleanJson(content));

  return {
    title: parsed.title || titleHint || 'Untitled meeting',
    summarySnippet: parsed.summarySnippet || '',
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    durationMinutes: Number(parsed.durationMinutes || 0) || undefined,
  };
};

export const regenerateSummary = async (transcript: string): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: serverConfig.openaiSummaryModel,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'Summarize meeting transcript in 3-4 concise sentences focused on decisions, outcomes, and follow-up.',
      },
      { role: 'user', content: transcript },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || '';
};

export const answerMeetingQuestion = async (
  transcript: string,
  question: string
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: serverConfig.openaiChatModel,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You answer questions using only the provided meeting transcript. If missing, state that clearly.',
      },
      {
        role: 'user',
        content: `Transcript:\n${transcript}\n\nQuestion:\n${question}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || '';
};
