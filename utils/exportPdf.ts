import { ActionItem } from '../types';

export interface MeetingExportData {
  title: string;
  date: string;
  time: string;
  source: string;
  summary: string;
  actionItems: ActionItem[];
  transcript?: string;
}

const statusBadge = (status: ActionItem['status']): string => {
  const map: Record<ActionItem['status'], string> = {
    Done: 'background:#d1fae5;color:#065f46;',
    'In Progress': 'background:#dbeafe;color:#1e40af;',
    Pending: 'background:#f3f4f6;color:#374151;',
  };
  return map[status] ?? map['Pending'];
};

export const exportMeetingPdf = (data: MeetingExportData): void => {
  const completedCount = data.actionItems.filter((i) => i.status === 'Done').length;
  const totalCount = data.actionItems.length;

  const actionItemsRows = data.actionItems
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:${item.status === 'Done' ? '#9ca3af' : '#111827'};${item.status === 'Done' ? 'text-decoration:line-through;' : ''}">${escapeHtml(item.text)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${escapeHtml(item.assignee || '—')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${escapeHtml(item.dueDate || '—')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
        <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;${statusBadge(item.status)}">${item.status}</span>
      </td>
    </tr>`
    )
    .join('');

  const transcriptSection = data.transcript
    ? `
    <div style="margin-top:36px;page-break-before:always;">
      <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Full Transcript</h2>
      <pre style="font-family:'Courier New',monospace;font-size:12px;color:#374151;white-space:pre-wrap;word-break:break-word;line-height:1.7;background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e5e7eb;margin:0;">${escapeHtml(data.transcript)}</pre>
    </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(data.title)} — Meeting Notes</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;background:#fff;padding:48px 56px;}
    @media print{
      body{padding:0;}
      @page{margin:2cm 2.2cm;size:A4;}
      .no-print{display:none!important;}
    }
    table{border-collapse:collapse;width:100%;}
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:24px;border-bottom:3px solid #13c8ec;margin-bottom:32px;">
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#13c8ec;text-transform:uppercase;margin-bottom:6px;">NoteAI • Meeting Notes</div>
      <h1 style="font-size:24px;font-weight:900;color:#0d191b;line-height:1.2;margin-bottom:10px;">${escapeHtml(data.title)}</h1>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#4c8d9a;">📅 ${escapeHtml(data.date)} at ${escapeHtml(data.time)}</span>
        <span style="font-size:12px;color:#4c8d9a;">🎙 ${escapeHtml(data.source)}</span>
        ${totalCount > 0 ? `<span style="font-size:12px;color:#4c8d9a;">✅ ${completedCount}/${totalCount} action items complete</span>` : ''}
      </div>
    </div>
    <div style="font-size:11px;color:#9ca3af;text-align:right;white-space:nowrap;">
      Exported ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </div>
  </div>

  <!-- Print button (screen only) -->
  <div class="no-print" style="margin-bottom:24px;display:flex;gap:10px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#13c8ec;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">
      Save as PDF / Print
    </button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      Close
    </button>
  </div>

  <!-- Executive Summary -->
  <div style="margin-bottom:32px;">
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Executive Summary</h2>
    <p style="font-size:14px;color:#374151;line-height:1.75;background:#f0fdfe;border-left:4px solid #13c8ec;padding:16px 20px;border-radius:0 8px 8px 0;">${escapeHtml(data.summary || 'No summary available.')}</p>
  </div>

  <!-- Action Items -->
  ${
    totalCount > 0
      ? `<div style="margin-bottom:32px;">
    <h2 style="font-size:16px;font-weight:700;color:#111827;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">
      Action Items
      <span style="font-size:12px;font-weight:400;color:#6b7280;margin-left:8px;">${completedCount} of ${totalCount} complete</span>
    </h2>
    <table>
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;">Description</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;width:130px;">Owner</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;width:110px;">Due Date</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e5e7eb;width:100px;">Status</th>
        </tr>
      </thead>
      <tbody>${actionItemsRows}</tbody>
    </table>
  </div>`
      : ''
  }

  ${transcriptSection}

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:11px;color:#9ca3af;">Generated by NoteAI • noteai.app</span>
    <span style="font-size:11px;color:#9ca3af;">${escapeHtml(data.title)}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
  if (!win) {
    alert('Could not open export window. Please allow pop-ups for this site.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
