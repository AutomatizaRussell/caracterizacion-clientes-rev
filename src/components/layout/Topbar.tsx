import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

type TopbarProps = {
  userName: string;
  userRole?: string | null;
  pageTitle: string;
  pageDescription?: string;
};

export default function Topbar({
  userName,
  userRole,
  pageTitle,
  pageDescription,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex h-[84px] min-w-0 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <Link
            href="/dashboard"
            className="block shrink-0 rounded-lg outline-none transition hover:opacity-90"
            aria-label="Ir al dashboard"
          >
            <Image
              src="/rb-logo.png"
              alt="Russell Bedford"
              width={250}
              height={80}
              priority
              className="h-auto w-[180px] object-contain sm:w-[220px] lg:w-[250px]"
            />
          </Link>

          <div className="hidden h-12 w-px shrink-0 bg-slate-200 md:block" />

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
        </div>

        <div className="shrink-0 text-right">
          <p
            className="max-w-[220px] truncate text-sm font-bold text-slate-900"
            title={userName}
          >
            {userName}
          </p>

          {userRole ? (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {userRole}
            </p>
          ) : null}
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
