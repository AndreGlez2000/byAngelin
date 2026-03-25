"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

export function CalendarSetupClient({ isConnected }: { isConnected: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const justConnected = params.get("connected") === "1";
  const hasError = params.get("error") === "no_refresh_token";
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch("/api/gcal/connect", { method: "DELETE" });
    router.refresh();
    setDisconnecting(false);
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-mauve" />
          <h1 className="text-xl font-semibold text-walnut">Google Calendar</h1>
        </div>

        {justConnected && (
          <div className="mb-4 p-3 bg-moss/10 text-moss rounded-lg text-sm">
            ✅ Calendario conectado correctamente
          </div>
        )}
        {hasError && (
          <div className="mb-4 p-3 bg-blossom/10 text-blossom-dark rounded-lg text-sm">
            Error: no se recibió token. Intenta de nuevo.
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 text-sm">
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-moss" />
              <span className="text-moss font-medium">Conectado</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-stone-400" />
              <span className="text-stone-400">No conectado</span>
            </>
          )}
        </div>

        <p className="text-sm text-stone-500 mb-6">
          {isConnected
            ? "Las citas se sincronizan automáticamente con tu Google Calendar."
            : "Conecta Google Calendar para que las citas aparezcan automáticamente."}
        </p>

        {isConnected ? (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 disabled:opacity-50"
          >
            {disconnecting ? "Desconectando..." : "Desconectar calendario"}
          </button>
        ) : (
          <a
            href="/api/gcal/connect"
            className="block w-full py-2.5 px-4 rounded-xl bg-mauve text-white text-sm text-center hover:bg-mauve/90"
          >
            Conectar Google Calendar
          </a>
        )}
      </div>
    </div>
  );
}
