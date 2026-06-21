import Link from "next/link";
import { BRAND } from "@/lib/brand";

type TopbarProps = {
  userName: string;
  userRole?: string | null;
};

export default function Topbar({ userName, userRole }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-[84px] items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="block rounded-lg outline-none transition hover:opacity-90"
            aria-label="Ir al dashboard"
          >
            <img
              src="/rb-logo.png"
              alt="Russell Bedford"
              className="h-auto w-[250px] object-contain"
            />
          </Link>

          <div className="hidden h-12 w-px bg-slate-200 md:block" />

          <div className="hidden md:block">
            <p
              className="text-sm font-extrabold uppercase tracking-widest"
              style={{ color: BRAND.navy }}
            >
              Centro de operación
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Gestión integrada de clientes, solicitudes y seguimiento
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{userName}</p>

          {userRole && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {userRole}
            </p>
          )}
        </div>
      </div>

      <div className="grid h-1 grid-cols-4">
        <div style={{ backgroundColor: BRAND.purple }} />
        <div style={{ backgroundColor: BRAND.teal }} />
        <div style={{ backgroundColor: BRAND.navy }} />
        <div style={{ backgroundColor: BRAND.orange }} />
      </div>
    </header>
  );
}