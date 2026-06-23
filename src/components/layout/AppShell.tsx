import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string | null;

  /**
   * Título contextual de la vista actual.
   *
   * La topbar comunica el contexto activo sin duplicar encabezados hero dentro
   * de cada página.
   */
  pageTitle?: string;

  /**
   * Descripción breve y operativa de la vista actual.
   *
   * No debe explicar arquitectura interna ni navegación que la UI debería
   * resolver por sí misma.
   */
  pageDescription?: string;
};

export default function AppShell({
  children,
  userName = "Usuario",
  userRole = null,
  pageTitle = "Centro de operación",
  pageDescription = "Gestión integrada de clientes, solicitudes y seguimiento",
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar userRole={userRole} />

      <div className="min-w-0 flex-1">
        <Topbar
          userName={userName}
          userRole={userRole}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
        />

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
