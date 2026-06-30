"use client";

import { useState } from "react";
import clsx from "clsx";
import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string | null;
  pageTitle?: string;
  pageDescription?: string;

  /**
   * Vistas operativas anchas, como asociación/revisión, deben iniciar con
   * sidebar colapsada para recuperar espacio horizontal. La decisión no se
   * persiste: al volver a entrar a estas vistas, vuelve a iniciar colapsada.
   */
  defaultSidebarCollapsed?: boolean;

  /**
   * Permite que pantallas densas usen más ancho que el shell estándar.
   * El ancho estándar sigue siendo adecuado para dashboards/listados simples.
   */
  wideContent?: boolean;
};

export default function AppShell({
  children,
  userName = "Usuario",
  userRole = null,
  pageTitle = "Centro de operación",
  pageDescription = "Gestión integrada de clientes, solicitudes y seguimiento",
  defaultSidebarCollapsed = false,
  wideContent = false,
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    defaultSidebarCollapsed,
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar
        userRole={userRole}
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
      />

      <div className="min-w-0 flex-1">
        <Topbar
          userName={userName}
          userRole={userRole}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
        />

        <main className="min-w-0 pb-28 lg:pb-0">
          <div
            className={clsx(
              "mx-auto w-full px-4 py-5 md:px-6 md:py-6",
              wideContent ? "max-w-[1800px]" : "max-w-[1500px]",
            )}
          >
            {children}
          </div>
        </main>

        <MobileNav userRole={userRole} />
      </div>
    </div>
  );
}
