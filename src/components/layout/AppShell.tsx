import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string | null;
};

export default function AppShell({
  children,
  userName = "Usuario",
  userRole = null,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Topbar userName={userName} userRole={userRole} />

      <div className="flex min-h-[calc(100vh-88px)]">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1500px] px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}