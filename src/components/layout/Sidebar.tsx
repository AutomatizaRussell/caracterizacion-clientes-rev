"use client";

import { useState } from "react";
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
  Menu,
  PanelLeftClose,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import clsx from "clsx";
import { BRAND } from "@/lib/brand";

type SidebarProps = {
  userRole?: string | null;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

type TooltipState = {
  label: string;
  x: number;
  y: number;
} | null;

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
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clientes", label: "Clientes", icon: Building2 },
      { href: "/equipo", label: "Mi equipo", icon: UsersRound },
      { href: "/solicitudes", label: "Solicitudes", icon: ClipboardList },
      { href: "/revision", label: "Revisión", icon: ClipboardCheck },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/permisos", label: "Permisos", icon: ShieldCheck, adminOnly: true },
      { href: "/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
];

function isAdminRole(userRole?: string | null) {
  return String(userRole ?? "").trim().toLowerCase() === "admin";
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getTooltipPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.right + 12,
    y: rect.top + rect.height / 2,
  };
}

export default function Sidebar({
  userRole,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const canSeeAdminItems = isAdminRole(userRole);
  const conectaUrl = process.env.NEXT_PUBLIC_CONECTA_URL || "/";
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || canSeeAdminItems),
  })).filter((group) => group.items.length > 0);

  function showTooltip(label: string, element: HTMLElement) {
    if (!collapsed) return;
    const position = getTooltipPosition(element);
    setTooltip({ label, x: position.x, y: position.y });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <>
      <aside
        className={clsx(
          "hidden h-screen shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 lg:sticky lg:top-0 lg:block",
          collapsed ? "w-20" : "w-80",
        )}
      >
        <div className="flex h-full flex-col">
          <div className={clsx("border-b border-slate-200", collapsed ? "px-2 py-5" : "px-6 py-6")}>
            <div className={clsx("flex", collapsed ? "flex-col items-center gap-4" : "items-center justify-between gap-3")}>
              <Link href="/dashboard" className="block min-w-0 rounded-xl outline-none transition hover:opacity-90" aria-label="Ir al dashboard">
                <Image
                  src="/rb-logo.png"
                  alt="Russell Bedford"
                  width={260}
                  height={90}
                  priority
                  unoptimized
                  className={clsx("h-auto object-contain transition-all", collapsed ? "w-11" : "w-[260px]")}
                />
              </Link>

              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#041461] shadow-sm transition hover:border-[#0ccba9] hover:bg-[#0ccba9]/10"
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                onClick={() => onCollapsedChange?.(!collapsed)}
                onMouseEnter={(event) => showTooltip(collapsed ? "Expandir menú" : "Colapsar menú", event.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                {collapsed ? <Menu size={22} /> : <PanelLeftClose size={20} />}
              </button>
            </div>
          </div>

          <div className={clsx("border-b border-slate-200 py-5", collapsed ? "px-2" : "px-6")}>
            <div className={clsx("flex items-start", collapsed ? "justify-center" : "gap-3")}>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(12, 203, 169, 0.18)", color: BRAND.navy }}
                aria-hidden="true"
                onMouseEnter={(event) => showTooltip("Plataforma Impulsa", event.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                <Layers size={18} />
              </div>

              {!collapsed ? (
                <div className="min-w-0">
                  <p className="text-base font-extrabold uppercase tracking-wide" style={{ color: BRAND.navy }}>Plataforma Impulsa</p>
                  <div className="mt-3 h-1 w-12 rounded-full" style={{ backgroundColor: BRAND.teal }} />
                </div>
              ) : null}
            </div>
          </div>

          <nav className={clsx("flex-1 overflow-y-auto py-5", collapsed ? "px-2" : "px-4")}>
            <div className={clsx(collapsed ? "space-y-5" : "space-y-7")}>
              {visibleGroups.map((group) => (
                <section key={group.label}>
                  {!collapsed ? <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{group.label}</p> : null}
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isActivePath(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-label={item.label}
                          onMouseEnter={(event) => showTooltip(item.label, event.currentTarget)}
                          onMouseLeave={hideTooltip}
                          className={clsx(
                            "flex items-center rounded-xl border-l-4 text-sm font-bold transition",
                            collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
                            isActive ? "shadow-sm" : "border-transparent text-slate-700 hover:bg-[#0ccba9]/10",
                          )}
                          style={isActive ? { backgroundColor: BRAND.teal, borderLeftColor: BRAND.tealDark, color: "white" } : undefined}
                        >
                          <Icon size={18} />
                          {!collapsed ? <span>{item.label}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <div className={clsx("border-t border-slate-200 py-4", collapsed ? "px-2" : "px-4")}>
            <a
              href={conectaUrl}
              aria-label="Volver a Conecta"
              onMouseEnter={(event) => showTooltip("Volver a Conecta", event.currentTarget)}
              onMouseLeave={hideTooltip}
              className={clsx(
                "flex items-center rounded-xl text-sm font-bold text-slate-600 transition hover:bg-[#0ccba9]/10 hover:text-[#020b3f]",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
              )}
            >
              <ArrowLeftFromLine size={18} />
              {!collapsed ? <span>Volver a Conecta</span> : null}
            </a>
          </div>
        </div>
      </aside>

      {tooltip ? (
        <div
          className="pointer-events-none fixed z-[300] -translate-y-1/2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-[#041461] shadow-xl ring-1 ring-slate-200"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.label}
        </div>
      ) : null}
    </>
  );
}
