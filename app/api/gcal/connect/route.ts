import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAuthUrl, exchangeCodeForTokens } from "@/lib/google-calendar";

// GET /api/gcal/connect          → redirect to Google OAuth
// GET /api/gcal/connect?code=... → exchange code, save refresh token, redirect to setup page
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gcalUser = session.user?.id
    ? { id: session.user.id }
    : session.user?.email
      ? await db.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

  if (!gcalUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const result = await exchangeCodeForTokens(gcalUser.id, code);
    if (!result) {
      return NextResponse.redirect(
        new URL("/setup/calendar?error=no_refresh_token", req.url),
      );
    }
    return NextResponse.redirect(new URL("/setup/calendar?connected=1", req.url));
  }

  const authUrl = getAuthUrl();
  return NextResponse.redirect(authUrl);
}

// DELETE /api/gcal/connect → clear stored refresh token
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gcalUser = session.user?.id
    ? { id: session.user.id }
    : session.user?.email
      ? await db.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

  if (!gcalUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.update({
    where: { id: gcalUser.id },
    data: { gcalRefreshToken: null },
  });
  return NextResponse.json({ success: true });
}
