import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createReceipt, getReceiptWithDetails } from "@/lib/receipts";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReciboPDF } from "@/components/ReciboPDF";
import React from "react";

type Params = { params: Promise<{ appointmentId: string }> };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mxn(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    if (!receipt)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedServices =
      receipt.appointment.services.length > 0
        ? receipt.appointment.services.map(
            (s: { service: { name: string; price: string } }) => ({
              name: s.service.name,
              price: s.service.price,
            })
          )
        : (receipt.appointment.service || "")
            .split(" + ")
            .map((name: string) => name.trim())
            .filter(Boolean)
            .map((name: string) => ({ name, price: "" }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(ReciboPDF as any, {
      clientName: receipt.appointment.client.name,
      services: mappedServices,
      date: formatDate(receipt.appointment.date),
      time: formatTime(receipt.appointment.date),
      totalAmount: mxn(receipt.totalAmount),
      paymentMethod: receipt.paymentMethod,
      notes: receipt.notes,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recibo-${receipt.appointment.client.name
          .replace(/\s+/g, "-")
          .toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[pdf] failed to generate receipt", error);
    return NextResponse.json(
      { error: "No se pudo generar el PDF" },
      { status: 500 },
    );
  }
}
