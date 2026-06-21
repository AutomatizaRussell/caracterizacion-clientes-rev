"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";
import clsx from "clsx";
import { BRAND } from "@/lib/brand";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
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

  {
    href: "/radicados",
    label: "Radicados",
    icon: FileText,
  },
  {
    href: "/permisos",
    label: "Permisos",
    icon: ShieldCheck,
  },
  {
    href: "/reportes",
    label: "Reportes",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <p
            className="text-base font-extrabold uppercase tracking-wide"
            style={{ color: BRAND.navy }}
          >
            Plataforma de Revisoría
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Clientes · Solicitudes · Caracterización
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition",
                  isActive
                    ? "bg-[#2d007f] text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-[#001871]",
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}