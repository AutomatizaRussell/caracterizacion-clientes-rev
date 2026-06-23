import { BRAND } from "@/lib/brand";

type TopbarProps = {
  userName: string;
  userRole?: string | null;
  pageTitle: string;
  pageDescription?: string;
};

function getUserInitial(userName: string) {
  const trimmedName = userName.trim();

  if (!trimmedName) {
    return "U";
  }

  return trimmedName.slice(0, 1).toUpperCase();
}

export default function Topbar({
  userName,
  userRole,
  pageTitle,
  pageDescription,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-[84px] min-w-0 items-center justify-between gap-4 px-4 md:px-8">
        <div className="hidden min-w-0 md:block">
          <p
            className="truncate text-sm font-extrabold uppercase tracking-widest"
            style={{ color: BRAND.navy }}
            title={pageTitle}
          >
            {pageTitle}
          </p>

          {pageDescription ? (
            <p
              className="mt-1 truncate text-sm text-slate-500"
              title={pageDescription}
            >
              {pageDescription}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 md:hidden">
          <p
            className="truncate text-sm font-extrabold uppercase tracking-widest"
            style={{ color: BRAND.navy }}
            title={pageTitle}
          >
            {pageTitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.purple})`,
            }}
            aria-hidden="true"
          >
            {getUserInitial(userName)}
          </div>

          <div className="hidden min-w-0 text-right sm:block">
            <p
              className="max-w-[220px] truncate text-sm font-extrabold uppercase text-slate-900"
              title={userName}
            >
              {userName}
            </p>

            {userRole ? (
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {userRole}
              </p>
            ) : null}
          </div>
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
