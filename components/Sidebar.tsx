"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CalendarDays,
  Users,
  Sparkles,
  LayoutDashboard,
  Package,
  Settings,
} from "lucide-react";

export default function Sidebar({ onClose }: { onClose?: () => void } = {}) {
  const path = usePathname();
  return (
    <aside className="w-52 bg-olive-dark min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="font-script text-4xl text-white/90 leading-none mb-1">
          Angelin
        </div>
        <div className="text-white/40 text-xs tracking-wide">
          Esthetician Studio
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        <NavItem
          href="/"
          icon={LayoutDashboard}
          label="Inicio"
          active={path === "/"}
          onClose={onClose}
        />
        <NavItem
          href="/agenda"
          icon={CalendarDays}
          label="Agenda"
          active={path.startsWith("/agenda")}
          onClose={onClose}
        />
        <NavItem
          href="/clientes"
          icon={Users}
          label="Clientas"
          active={path.startsWith("/clientes")}
          onClose={onClose}
        />
        <NavItem
          href="/servicios"
          icon={Sparkles}
          label="Servicios"
          active={path.startsWith("/servicios")}
          onClose={onClose}
        />
        <NavItem
          href="/inventario"
          icon={Package}
          label="Inventario"
          active={path.startsWith("/inventario")}
          onClose={onClose}
        />
      </nav>

      {/* Settings */}
      <div className="px-3 pb-2">
        <NavItem
          href="/setup/calendar"
          icon={Settings}
          label="Configuración"
          active={path.startsWith("/setup")}
          onClose={onClose}
        />
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 w-full text-left group"
        >
          <div className="w-7 h-7 rounded-full bg-blossom/50 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">A</span>
          </div>
          <span className="text-white/55 text-xs group-hover:text-white/90 transition-colors">
            Angelin
          </span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClose,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClose?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-white/12 text-white"
          : "text-white/50 hover:bg-white/6 hover:text-white/80"
      }`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
