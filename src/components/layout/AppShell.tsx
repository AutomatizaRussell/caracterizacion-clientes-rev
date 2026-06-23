import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string | null;

  /**
   * Título contextual de la vista actual.
   *
   * Mantiene la topbar como fuente principal de orientación y evita repetir
   * encabezados hero dentro de cada página.
   */
  pageTitle?: string;

  /**
   * Descripción breve y operativa de la vista actual.
   *
   * No debe explicar decisiones internas de arquitectura, nombres históricos
   * del proyecto ni navegación que debería ser evidente por la interfaz.
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Topbar
        userName={userName}
        userRole={userRole}
        pageTitle={pageTitle}
        pageDescription={pageDescription}
      />

      <div className="flex min-h-[calc(100vh-88px)]">
        <Sidebar userRole={userRole} />

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
