
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftFromLine,
  BarChart3,
  Building2,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import clsx from "clsx";
import { BRAND } from "@/lib/brand";

type SidebarProps = {
  userRole?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  adminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operación",
    items: [
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
        href: "/equipo",
        label: "Mi equipo",
        icon: UsersRound,
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
    ],
  },
  {
    label: "Administración",
    items: [
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
    ],
  },
];

function isAdminRole(userRole?: string | null) {
  return String(userRole ?? "").trim().toLowerCase() === "admin";
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const canSeeAdminItems = isAdminRole(userRole);
  const conectaUrl = process.env.NEXT_PUBLIC_CONECTA_URL || "/";

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.adminOnly) {
        return true;
      }

      return canSeeAdminItems;
    }),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="hidden h-screen w-80 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-6 py-6">
          <Link
            href="/dashboard"
            className="block rounded-xl outline-none transition hover:opacity-90"
            aria-label="Ir al dashboard"
          >
            <Image
              src="/rb-logo.png"
              alt="Russell Bedford"
              width={260}
              height={90}
              priority
              unoptimized
              className="h-auto w-[260px] object-contain"
            />
          </Link>
        </div>

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "rgba(12, 203, 169, 0.18)",
                color: BRAND.navy,
              }}
              aria-hidden="true"
            >
              <Layers size={18} />
            </div>

            <div className="min-w-0">
              <p
                className="text-base font-extrabold uppercase tracking-wide"
                style={{ color: BRAND.navy }}
              >
                Plataforma Impulsa
              </p>

              <div
                className="mt-3 h-1 w-12 rounded-full"
                style={{ backgroundColor: BRAND.teal }}
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-7">
            {visibleGroups.map((group) => (
              <section key={group.label}>
                <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                  {group.label}
                </p>

                <div className="space-y-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex items-center gap-3 rounded-xl border-l-4 px-4 py-3 text-sm font-bold transition",
                          isActive
                            ? "shadow-sm"
                            : "border-transparent text-slate-700 hover:bg-[#0ccba9]/10",
                        )}
                        style={
                          isActive
                            ? {
                                backgroundColor: BRAND.teal,
                                borderLeftColor: BRAND.tealDark,
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
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <a
            href={conectaUrl}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-[#0ccba9]/10 hover:text-[#020b3f]"
          >
            <ArrowLeftFromLine size={18} />
            <span>Volver a Conecta</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
