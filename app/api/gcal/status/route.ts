import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
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

  const user = await db.user.findUnique({
    where: { id: gcalUser.id },
    select: { gcalRefreshToken: true },
  });
  return NextResponse.json({ connected: !!user?.gcalRefreshToken });
}
