import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CalendarSetupClient } from "./_components/CalendarSetupClient";

export default async function CalendarSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await db.user.findFirst({ select: { gcalRefreshToken: true } });
  return <CalendarSetupClient isConnected={!!user?.gcalRefreshToken} />;
}
