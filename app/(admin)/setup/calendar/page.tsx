import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CalendarSetupClient } from "./_components/CalendarSetupClient";

export default async function CalendarSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user?.id
    ? session.user.id
    : session.user?.email
      ? (
          await db.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          })
        )?.id
      : null;

  if (!userId) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { gcalRefreshToken: true },
  });
  return <CalendarSetupClient isConnected={!!user?.gcalRefreshToken} />;
}
