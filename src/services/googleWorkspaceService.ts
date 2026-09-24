import { getAccessToken } from './googleAuth';

// ==========================================
// 1. GOOGLE CALENDAR API (V3)
// ==========================================
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
}

export async function fetchCalendarEvents(maxResults: number = 20): Promise<GoogleCalendarEvent[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای مشاهده تقویم گوگل، ابتدا با حساب گوگل خود وارد شوید.');

  const now = new Date().toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      now
    )}&maxResults=${maxResults}&orderBy=startTime&singleEvents=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`خطای دریافت رویدادهای تقویم (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(eventData: GoogleCalendarEvent): Promise<GoogleCalendarEvent> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای ثبت رویداد، لطفاً ابتدا وارد حساب گوگل شوید.');

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`خطای ساخت رویداد در تقویم (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای حذف رویداد، لطفاً ابتدا وارد حساب گوگل شوید.');

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`خطای حذف رویداد تقویم (${res.status}): ${errorText}`);
  }
}

// ==========================================
// 2. GOOGLE DRIVE API (V3)
// ==========================================
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

export async function fetchDriveFiles(pageSize: number = 25): Promise<GoogleDriveFile[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای مشاهده فایل‌های گوگل درایو، ابتدا با حساب گوگل خود وارد شوید.');

  const query = "trashed = false";
  const fields = 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink)';
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${encodeURIComponent(
      query
    )}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`خطای دریافت فایل‌های گوگل درایو (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function createDriveFile(
  name: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<GoogleDriveFile> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای آپلود در درایو، لطفاً ابتدا وارد حساب گوگل شوید.');

  const metadata = {
    name,
    mimeType,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append('file', new Blob([content], { type: mimeType }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`خطای ذخیره فایل در درایو (${res.status}): ${errorText}`);
  }

  return await res.json();
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای حذف فایل از درایو، لطفاً ابتدا وارد شوید.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`خطای حذف فایل درایو (${res.status}): ${errorText}`);
  }
}

// ==========================================
// 3. GMAIL API (V1)
// ==========================================
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  unread?: boolean;
}

export async function fetchGmailMessages(maxResults: number = 15): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای مشاهده ایمیل‌ها، ابتدا وارد حساب گوگل شوید.');

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    }
  );

  if (!listRes.ok) {
    const errorText = await listRes.text();
    throw new Error(`خطای دریافت لیست ایمیل‌ها (${listRes.status}): ${errorText}`);
  }

  const listData = await listRes.json();
  const messageItems: { id: string }[] = listData.messages || [];

  if (messageItems.length === 0) return [];

  // Fetch headers & snippet for each message
  const fullMessages = await Promise.all(
    messageItems.slice(0, 10).map(async (msg) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );
        if (!itemRes.ok) return null;
        const data = await itemRes.json();
        const headers = data.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'نامشخص';
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(بدون موضوع)';
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        return {
          id: data.id,
          threadId: data.threadId,
          snippet: data.snippet,
          from: fromHeader,
          subject: subjectHeader,
          date: dateHeader,
          unread: data.labelIds?.includes('UNREAD'),
        };
      } catch {
        return null;
      }
    })
  );

  return fullMessages.filter(Boolean) as GmailMessageSummary[];
}

export async function sendGmailMessage(to: string, subject: string, bodyText: string): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error('برای ارسال ایمیل، لطفاً با حساب گوگل وارد شوید.');

  // Construct RFC 2822 email format and base64url encode
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ];
  const emailRaw = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64EncodedEmail }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`خطای ارسال ایمیل (${res.status}): ${errorText}`);
  }

  return await res.json();
}
