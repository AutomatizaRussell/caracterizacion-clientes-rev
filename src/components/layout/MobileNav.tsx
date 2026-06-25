"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftFromLine,
  BarChart3,
  Building2,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  MoreHorizontal,
  ShieldCheck,
  X,
} from "lucide-react";
import clsx from "clsx";
import { BRAND } from "@/lib/brand";

type MobileNavProps = {
  userRole?: string | null;
};

type MobileNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  adminOnly?: boolean;
};

const PRIMARY_ITEMS: MobileNavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Building2,
  },
  {
    href: "/solicitudes",
    label: "Solicitudes",
    icon: ClipboardList,
  },
  {
    href: "/revision-entregables-demo",
    label: "Revisión",
    icon: ClipboardCheck,
  },
];

const MORE_ITEMS: MobileNavItem[] = [
  {
    href: "/permisos",
    label: "Permisos",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
  },
];

function isAdminRole(userRole?: string | null) {
  return String(userRole ?? "").trim().toLowerCase() === "admin";
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileNav({ userRole }: MobileNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const conectaUrl = process.env.NEXT_PUBLIC_CONECTA_URL || "/";
  const canSeeAdminItems = isAdminRole(userRole);

  const moreItems = MORE_ITEMS.filter((item) => {
    if (!item.adminOnly) {
      return true;
    }

    return canSeeAdminItems;
  });

  return (
    <>
      {isMoreOpen ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/40 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p
                className="text-xs font-extrabold uppercase tracking-widest"
                style={{ color: BRAND.navy }}
              >
                Más opciones
              </p>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition",
                      isActive
                        ? "border-transparent"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: BRAND.teal,
                            color: "white",
                          }
                        : undefined
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <a
                href={conectaUrl}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeftFromLine size={18} />
                <span>Volver a Conecta</span>
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white px-2 pb-2 pt-1 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold transition",
                  isActive ? "text-white" : "text-slate-500",
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: BRAND.teal,
                      }
                    : undefined
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50"
          >
            <MoreHorizontal size={18} />
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
