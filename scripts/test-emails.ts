/**
 * Script de prueba para enviar correos de confirmación y recordatorio.
 * Uso: npx tsx scripts/test-emails.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { sendConfirmationEmail, sendReminderEmail } from "../lib/email";

const RECIPIENTS = [
  { email: "gonzalez.andre@uabc.edu.mx", name: "André (Prueba)" },
];
const TEST_SERVICE = "Facial Profundo";
const TEST_DATE = new Date(Date.now() + 24 * 60 * 60 * 1000); // mañana

async function main() {
  for (const { email, name } of RECIPIENTS) {
    console.log(`\nEnviando a ${email}...`);
    await sendConfirmationEmail({
      to: email,
      clientName: name,
      service: TEST_SERVICE,
      date: TEST_DATE,
      price: "$850 MXN",
      isFirstVisit: true,
    });
    console.log("  ✓ Confirmación enviada");

    await sendReminderEmail({
      to: email,
      clientName: name,
      service: TEST_SERVICE,
      date: TEST_DATE,
      price: "$850 MXN",
    });
    console.log("  ✓ Recordatorio enviado");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
