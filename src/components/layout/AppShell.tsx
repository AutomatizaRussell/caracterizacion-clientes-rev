import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string | null;
  pageTitle?: string;
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

        <main className="min-w-0 pb-24 lg:pb-0">
          <div className="mx-auto w-full max-w-[1500px] px-4 py-5 md:px-6 md:py-6">
            {children}
          </div>
        </main>

        <MobileNav userRole={userRole} />
      </div>
    </div>
  );
}
