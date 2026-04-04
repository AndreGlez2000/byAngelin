import { google } from "googleapis";
import { db } from "@/lib/db";

const CALENDAR_ID = "primary";
const TIMEZONE = "America/Tijuana";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(): string {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(
  userId: string,
  code: string,
): Promise<{ refreshToken: string } | null> {
  const oauth2 = getOAuthClient();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) return null;
  await db.user.update({
    where: { id: userId },
    data: { gcalRefreshToken: tokens.refresh_token },
  });
  return { refreshToken: tokens.refresh_token };
}

async function getAuthedClient(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { gcalRefreshToken: true },
  });
  if (!user?.gcalRefreshToken) return null;
  const oauth2 = getOAuthClient();
  oauth2.setCredentials({ refresh_token: user.gcalRefreshToken });
  return oauth2;
}

export async function createCalendarEvent(params: {
  userId: string;
  summary: string;
  start: Date;
  durationMin: number;
  description?: string;
}): Promise<string | null> {
  try {
    const auth = await getAuthedClient(params.userId);
    if (!auth) return null;

    const end = new Date(params.start.getTime() + params.durationMin * 60_000);
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: params.summary,
        description: params.description ?? "Cita en Angelin Esthetician",
        start: { dateTime: params.start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
      },
    });
    return res.data.id ?? null;
  } catch (err) {
    console.error("[gcal] createCalendarEvent failed:", err);
    return null;
  }
}

export async function updateCalendarEvent(params: {
  userId: string;
  eventId: string;
  summary?: string;
  start?: Date;
  durationMin?: number;
}): Promise<void> {
  try {
    const auth = await getAuthedClient(params.userId);
    if (!auth) return;

    const body: Record<string, unknown> = {};
    if (params.summary) body.summary = params.summary;
    if (params.start && params.durationMin !== undefined) {
      const end = new Date(params.start.getTime() + params.durationMin * 60_000);
      body.start = { dateTime: params.start.toISOString(), timeZone: TIMEZONE };
      body.end = { dateTime: end.toISOString(), timeZone: TIMEZONE };
    }

    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId: params.eventId,
      requestBody: body,
    });
  } catch (err) {
    console.error("[gcal] updateCalendarEvent failed:", err);
  }
}

export async function deleteCalendarEvent(
  userId: string,
  eventId: string,
): Promise<void> {
  try {
    const auth = await getAuthedClient(userId);
    if (!auth) return;

    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
  } catch (err) {
    console.error("[gcal] deleteCalendarEvent failed:", err);
  }
}
