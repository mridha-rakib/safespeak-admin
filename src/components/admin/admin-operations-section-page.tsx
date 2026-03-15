import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";

export type AdminOperationsQuickLink = {
  label: string;
  to: string;
  description: string;
};

export type AdminOperationsModule = {
  id: string;
  label: string;
  status: "Priority" | "Active" | "Monitored" | "Ready";
  summary: string;
  owner: string;
  cadence: string;
  metric: string;
  highlights: string[];
};

export type AdminOperationsStat = {
  label: string;
  value: string;
  helper: string;
};

export type AdminOperationsSectionConfig = {
  eyebrow: string;
  title: string;
  description: string;
  statusNote: string;
  stats: AdminOperationsStat[];
  modules: AdminOperationsModule[];
  quickLinks: AdminOperationsQuickLink[];
  watchlistTitle: string;
  watchlist: string[];
  footerNote?: ReactNode;
};

function statusClass(status: AdminOperationsModule["status"]) {
  if (status === "Priority") {
    return "bg-[#FFF4E5] text-[#9A3412]";
  }

  if (status === "Active") {
    return "bg-[#E8F7EE] text-[#0F7A43]";
  }

  if (status === "Monitored") {
    return "bg-[#EEF6FF] text-[#0F67AE]";
  }

  return "bg-[#F1F5F9] text-[#334155]";
}

export function AdminOperationsSectionPage({ config }: { config: AdminOperationsSectionConfig }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFocus = searchParams.get("focus");
  const activeModule = config.modules.find(module => module.id === requestedFocus) ?? config.modules[0];

  const setActiveModule = (moduleId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("focus", moduleId);
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#607B90]">{config.eyebrow}</p>
            <div className="space-y-1">
              <h2 className="text-[28px] font-semibold leading-none text-[#1E293B] sm:text-[32px]">{config.title}</h2>
              <p className="max-w-3xl text-sm leading-6 text-[#607B90]">{config.description}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#D6E3F0] bg-[#F7FBFF] px-3 py-2 text-[12px] font-semibold text-[#0F67AE]">
            <span className="h-2 w-2 rounded-full bg-[#0F67AE]" />
            {config.statusNote}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {config.stats.map(stat => (
            <article
              key={stat.label}
              className="rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3"
            >
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">{stat.label}</p>
              <p className="mt-2 text-[30px] font-semibold leading-none text-[#1E293B]">{stat.value}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#607B90]">{stat.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <aside className="rounded-xl border border-[#CAD7E3] bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <div className="mb-3">
            <h3 className="text-[18px] font-semibold text-[#1E293B]">Controls In Scope</h3>
            <p className="mt-1 text-[12px] text-[#607B90]">Each control below is active and shareable through the `focus` query param.</p>
          </div>

          <div className="space-y-2">
            {config.modules.map(module => (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]",
                  activeModule.id === module.id
                    ? "border-[#0F67AE] bg-[#EEF6FF]"
                    : "border-[#D8E3EE] bg-white hover:bg-[#F8FBFF]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#1E293B]">{module.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(module.status)}`}>
                    {module.status}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#607B90]">{module.summary}</p>
              </button>
            ))}
          </div>
        </aside>

        <article className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-3 border-b border-[#E5ECF3] pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[24px] font-semibold leading-none text-[#1E293B]">{activeModule.label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(activeModule.status)}`}>
                  {activeModule.status}
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-[#607B90]">{activeModule.summary}</p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModule(activeModule.id)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-4 text-[13px] font-semibold text-[#0F67AE] transition hover:bg-[#F3F8FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              Refresh Focus
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3">
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">OWNER</p>
              <p className="mt-2 text-[15px] font-semibold text-[#1E293B]">{activeModule.owner}</p>
            </div>
            <div className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3">
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">REVIEW CADENCE</p>
              <p className="mt-2 text-[15px] font-semibold text-[#1E293B]">{activeModule.cadence}</p>
            </div>
            <div className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3">
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">SUCCESS SIGNAL</p>
              <p className="mt-2 text-[15px] font-semibold text-[#1E293B]">{activeModule.metric}</p>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-[16px] font-semibold text-[#1E293B]">Implementation Details</h4>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {activeModule.highlights.map(highlight => (
                <li
                  key={highlight}
                  className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3 text-[13px] leading-6 text-[#475569]"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {config.footerNote
            ? <div className="mt-5 rounded-xl border border-[#E5ECF3] bg-[#F8FBFF] px-4 py-3 text-sm text-[#52667A]">{config.footerNote}</div>
            : null}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <div className="mb-3">
            <h3 className="text-[18px] font-semibold text-[#1E293B]">Related Admin Areas</h3>
            <p className="mt-1 text-[12px] text-[#607B90]">These routes connect the current control to nearby operational workflows.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {config.quickLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 transition hover:border-[#0F67AE] hover:bg-[#EEF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
              >
                <p className="text-[14px] font-semibold text-[#1E293B]">{link.label}</p>
                <p className="mt-2 text-[12px] leading-5 text-[#607B90]">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <h3 className="text-[18px] font-semibold text-[#1E293B]">{config.watchlistTitle}</h3>
          <ul className="mt-3 space-y-2">
            {config.watchlist.map(item => (
              <li
                key={item}
                className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3 text-[13px] leading-6 text-[#475569]"
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
