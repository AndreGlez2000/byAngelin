import React from "react";
import { Sparkles, CheckCircle2, XCircle, Receipt, CalendarX2 } from "lucide-react";

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-[#FCFAF8] p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b border-olive/10 pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-script text-olive-dark italic mb-2">Laboratorio de Diseño</h1>
            <p className="text-olive/60 text-sm tracking-wide">
              Sistema de Tarjetas Premium (Variantes de Estado)
            </p>
          </div>
          <a href="/agenda" className="text-xs uppercase tracking-widest text-olive/40 hover:text-olive transition-colors font-bold underline underline-offset-4">
            Volver al App
          </a>
        </header>

        {/* ESTADO: CONFIRMADA (El elegido) */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-sm font-bold tracking-widest uppercase text-olive-dark mb-1">1. Cita Confirmada (Pendiente)</h2>
            <p className="text-sm text-olive/60">El diseño Premium que elegiste. Este será el foco principal del día.</p>
          </div>
          
          <div className="max-w-sm">
            <div className="bg-olive-dark rounded-2xl p-5 shadow-lg relative overflow-hidden text-parchment-dark">
              <Sparkles className="absolute -right-4 -top-4 opacity-10 text-parchment" size={90} />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-white text-lg">Mariana Vega</h3>
                    <p className="text-xs text-white/60 mt-0.5">Limpieza Facial Profunda</p>
                  </div>
                  <span className="text-[10px] font-bold text-olive-dark bg-parchment px-2 py-1 rounded-md uppercase tracking-wide">11:00 AM</span>
                </div>
                <button className="w-full py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors border border-white/10">
                  Ver Ficha / Cobrar
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-olive/10 pt-12">
          
          {/* ESTADO: COMPLETADAS */}
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-bold tracking-widest uppercase text-moss-dark mb-1">2. Opciones para "Completadas"</h2>
              <p className="text-sm text-olive/60">Ya se atendió y se cobró. Debe verse bien pero no competir con las pendientes.</p>
            </div>
            
            <div className="space-y-8">
              {/* Completada - Opción A */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-olive/40 tracking-wider">Opción A: Estilo Ticket (Fondo Crema)</span>
                <div className="bg-parchment/30 border border-olive/10 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1 border-l border-dashed border-olive/20" />
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-olive-dark flex items-center gap-2">
                        Mariana Vega <CheckCircle2 size={14} className="text-moss-dark" />
                      </h3>
                      <p className="text-xs text-olive/60 mt-0.5">Limpieza Facial Profunda</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-moss-dark bg-moss/10 border border-moss/20 px-2 py-1 rounded-md uppercase tracking-wide block mb-1">Completada</span>
                      <span className="text-[10px] text-olive/50 font-mono">11:00 AM</span>
                    </div>
                  </div>
                  <button className="w-full py-2.5 text-sm font-medium border border-olive/15 bg-white/50 rounded-xl text-olive hover:bg-white transition-colors flex items-center justify-center gap-2">
                    <Receipt size={14} /> Ver Recibo
                  </button>
                </div>
              </div>

              {/* Completada - Opción B */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-olive/40 tracking-wider">Opción B: Estilo Muteado (Fondo Gris/Verde)</span>
                <div className="bg-white border border-moss/30 rounded-2xl p-5 shadow-[inset_0_0_20px_rgba(157,184,154,0.1)] opacity-90">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-olive-dark">Mariana Vega</h3>
                      <p className="text-xs text-olive/50 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-moss" /> $800.00 MXN
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-olive/50 bg-olive/5 px-2 py-1 rounded-md uppercase tracking-wide">11:00 AM</span>
                  </div>
                  <button className="w-full py-2.5 text-sm font-medium bg-moss/10 rounded-xl text-moss-dark hover:bg-moss/20 transition-colors">
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ESTADO: CANCELADAS */}
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-bold tracking-widest uppercase text-blossom-dark mb-1">3. Opciones para "Canceladas"</h2>
              <p className="text-sm text-olive/60">No se hizo. Tienen que verse apagadas para no estorbar la vista.</p>
            </div>
            
            <div className="space-y-8">
              {/* Cancelada - Opción A */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-olive/40 tracking-wider">Opción A: Estilo Fantasma (Transparente)</span>
                <div className="bg-transparent border border-dashed border-olive/20 rounded-2xl p-5 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-olive/60 line-through decoration-olive/30">Mariana Vega</h3>
                      <p className="text-xs text-olive/40 mt-0.5">Limpieza Facial Profunda</p>
                    </div>
                    <span className="text-[10px] font-bold text-olive/40 bg-transparent border border-olive/20 px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1">
                      <XCircle size={10} /> Cancelada
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancelada - Opción B */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-olive/40 tracking-wider">Opción B: Tintado Rosa (Blossom)</span>
                <div className="bg-blossom/5 border border-blossom/20 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-blossom-dark">Mariana Vega</h3>
                      <p className="text-xs text-blossom-dark/60 mt-0.5">Canceló por mensaje</p>
                    </div>
                    <span className="text-[10px] font-bold text-blossom-dark bg-blossom/10 px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1">
                      <CalendarX2 size={10} /> 11:00 AM
                    </span>
                  </div>
                  <button className="w-full py-2.5 text-sm font-medium bg-white/50 border border-blossom/20 rounded-xl text-blossom-dark hover:bg-white transition-colors">
                    Reagendar
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}