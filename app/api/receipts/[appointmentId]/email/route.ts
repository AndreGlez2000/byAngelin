import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createReceipt, getReceiptWithDetails } from "@/lib/receipts";
import { sendReceiptEmail } from "@/lib/email";

type Params = { params: Promise<{ appointmentId: string }> };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const emailTo =
    typeof body?.emailTo === "string" ? body.emailTo.trim().toLowerCase() : "";
  if (emailTo && !isValidEmail(emailTo)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const { appointmentId } = await params;
  let receipt = await getReceiptWithDetails(appointmentId);

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
        services: { include: { service: { select: { price: true } } } },
      },
    });

    if (appt) {
      const canAutoBackfill =
        appt.status === "COMPLETED" ||
        (appt.status === "CONFIRMED" && appt.date <= now);

      if (canAutoBackfill) {
        const servicesTotal = appt.services.reduce((sum, s) => {
          const n = parseFloat(s.service.price.replace(/[^0-9.]/g, ""));
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);
        const totalAmount = appt.pricePaid ?? servicesTotal;
        if (Number.isFinite(totalAmount) && totalAmount >= 0) {
          await createReceipt(
            appt.id,
            totalAmount,
            appt.paymentMethod ?? "Efectivo",
          );
          receipt = await getReceiptWithDetails(appointmentId);
        }
      }
    }
  }

  if (!receipt) return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 });
  const recipient = emailTo || receipt.appointment.client.email || "";

  if (!recipient) {
    return NextResponse.json(
      { error: "La clienta no tiene correo registrado. Escribe uno temporal para enviar." },
      { status: 422 },
    );
  }

  await sendReceiptEmail({
    to: recipient,
    clientName: receipt.appointment.client.name,
    services: receipt.appointment.services.map((s: { service: { name: string; price: string } }) => ({
      name: s.service.name,
      price: s.service.price,
    })),
    date: receipt.appointment.date,
    totalAmount: receipt.totalAmount,
    paymentMethod: receipt.paymentMethod,
    notes: receipt.notes,
  });

  return NextResponse.json({ ok: true });
}
