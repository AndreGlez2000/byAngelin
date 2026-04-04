import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createReceipt, getReceiptWithDetails } from "@/lib/receipts";

type Params = { params: Promise<{ appointmentId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId } = await params;
  let receipt = await getReceiptWithDetails(appointmentId);

  // Backfill automático: si la cita está COMPLETED y aún no tiene recibo,
  // lo creamos al vuelo para no romper la UX de click->recibo.
  if (!receipt) {
    const now = new Date();
    const appt = await db.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        date: true,
        pricePaid: true,
        paymentMethod: true,
        services: {
          include: {
            service: { select: { price: true } },
          },
        },
      },
    });

    if (!appt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isCompletedByStatus = appt.status === "COMPLETED";
    const isCompletedByTime = appt.status === "CONFIRMED" && appt.date <= now;
    const canAutoBackfill = isCompletedByStatus || isCompletedByTime;

    if (!canAutoBackfill) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const servicesTotal = appt.services.reduce((sum, s) => {
      const n = parseFloat(s.service.price.replace(/[^0-9.]/g, ""));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    const totalAmount = appt.pricePaid ?? servicesTotal;
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const paymentMethod = appt.paymentMethod ?? "Efectivo";

    await createReceipt(appt.id, totalAmount, paymentMethod);
    receipt = await getReceiptWithDetails(appointmentId);
  }

  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(receipt);
}
