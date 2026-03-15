import { APP_ROUTE_PATHS } from "@/routes/paths";
import { cn } from "@/lib/utils";
import { Link, useLocation, useSearchParams } from "react-router-dom";

type DashboardRangeKey = "24h" | "7d" | "30d" | "90d";

const RANGE_TABS = [
  { key: "24h", label: "Last 24h" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
] as const;

const KPI_CARDS = [
  {
    label: "HIGH-RISK ESCALATIONS",
    value: "46",
    detail: "Critical and emergency-bound cases reviewed this period.",
  },
  {
    label: "PARTNER DELIVERY SUCCESS",
    value: "97.4%",
    detail: "Agency and support-service submissions delivered or retried successfully.",
  },
  {
    label: "MULTILINGUAL COVERAGE",
    value: "8 packs",
    detail: "Priority-language operations tracked with validation workflows.",
  },
  {
    label: "AUDITED ADMIN ACTIONS",
    value: "1,284",
    detail: "Privileged changes, sensitive access, and evidence events captured.",
  },
] as const;

const CAPABILITY_GROUPS = [
  {
    title: "Security & Compliance Center",
    summary: "Identity, privacy, legal, and data-protection controls for a sensitive victim-data platform.",
    links: [
      { label: "Identity & Access Management", to: APP_ROUTE_PATHS.adminIdentityAccessManagement },
      { label: "Data Protection", to: APP_ROUTE_PATHS.adminDataProtection },
      { label: "Legal Compliance", to: APP_ROUTE_PATHS.adminLegalCompliance },
    ],
  },
  {
    title: "Platform Intelligence Engine",
    summary: "Taxonomies, destinations, integrations, AI operations, and cultural response controls.",
    links: [
      { label: "Taxonomies Management", to: APP_ROUTE_PATHS.adminTaxonomiesManagement },
      { label: "Service Destinations", to: APP_ROUTE_PATHS.adminServiceDestinations },
      { label: "AI Engine Control", to: APP_ROUTE_PATHS.adminAiEngineControl },
    ],
  },
  {
    title: "Crisis & Safety Management",
    summary: "Emergency routing, risk assessment, content moderation, and safety planning workflows.",
    links: [
      { label: "Crisis Response Center", to: APP_ROUTE_PATHS.adminCrisisResponseCenter },
      { label: "Content Moderation", to: APP_ROUTE_PATHS.adminContentModeration },
      { label: "Audit Logs", to: APP_ROUTE_PATHS.adminAuditLogs },
    ],
  },
] as const;

const PRIORITY_ROUTES = [
  {
    title: "Taxonomies Management",
    description: "The platform's classification DNA for incidents, evidence, destinations, severity, culture, and language.",
    to: APP_ROUTE_PATHS.adminTaxonomiesManagement,
  },
  {
    title: "Service Destinations",
    description: "Routing for police, legal aid, emergency contacts, and community organizations.",
    to: APP_ROUTE_PATHS.adminServiceDestinations,
  },
  {
    title: "Integration Management",
    description: "Partner APIs, OAuth or mTLS auth, delivery receipts, fallbacks, and MOU tracking.",
    to: APP_ROUTE_PATHS.adminIntegrationManagement,
  },
  {
    title: "AI Engine Control",
    description: "Model performance, translation quality, bias review, guardrails, and human-in-loop workflow.",
    to: APP_ROUTE_PATHS.adminAiEngineControl,
  },
  {
    title: "Platform Health",
    description: "Uptime, error tracking, API latency, disaster recovery, and incident management visibility.",
    to: APP_ROUTE_PATHS.adminPlatformHealth,
  },
  {
    title: "Crisis Response Center",
    description: "DV indicators, emergency routing, covert-mode visibility, and safety-planning oversight.",
    to: APP_ROUTE_PATHS.adminCrisisResponseCenter,
  },
] as const;

const CURRENT_SECTION_LINKS = [
  { label: "Users", to: APP_ROUTE_PATHS.adminUsers },
  { label: "Feedback", to: APP_ROUTE_PATHS.adminFeedback },
  { label: "Educational Content", to: APP_ROUTE_PATHS.adminContentEducationalContent },
  { label: "Micro-Education Cards", to: APP_ROUTE_PATHS.adminContentMicroEducationCards },
  { label: "Incident Insights & Trends", to: APP_ROUTE_PATHS.adminInsightsIncidentTrends },
  { label: "Settings", to: APP_ROUTE_PATHS.adminSettings },
] as const;

type AdminDashboardOverviewProps = {
  title?: string;
  description?: string;
};

export function AdminDashboardOverview({
  title = "SafeSpeak Command Dashboard",
  description = "A single operational view for intelligence, compliance, cultural routing, crisis response, and the content systems that support them.",
}: AdminDashboardOverviewProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const searchRange = searchParams.get("range");
  const activeRange: DashboardRangeKey = RANGE_TABS.some(tab => tab.key === searchRange)
    ? (searchRange as DashboardRangeKey)
    : "7d";

  const buildRangeHref = (range: DashboardRangeKey) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("range", range);
    return `${location.pathname}?${nextParams.toString()}`;
  };

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5 lg:gap-6">
      <section className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#607B90]">Admin Command Center</p>
            <h2 className="text-[30px] font-semibold leading-none text-[#1E293B] sm:text-[34px]">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-[#607B90]">{description}</p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#D6E3F0] bg-[#F7FBFF] px-3 py-2 text-[12px] font-semibold text-[#0F67AE]">
            <span className="h-2 w-2 rounded-full bg-[#0F67AE]" />
            Scope-aligned admin map now active
          </div>
        </div>

        <div className="mt-5 -mx-1 overflow-x-auto border-b border-[#D6E0EB] px-1 pb-2">
          <div className="flex min-w-max items-center gap-5 sm:gap-7">
            {RANGE_TABS.map(tab => (
              <Link
                key={tab.key}
                to={buildRangeHref(tab.key)}
                className={cn(
                  "pb-2 text-[13px] font-semibold transition",
                  activeRange === tab.key
                    ? "border-b-2 border-[#0F67AE] text-[#1E293B]"
                    : "text-[#607B90] hover:text-[#1E293B]",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map(card => (
            <article
              key={card.label}
              className="rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3"
            >
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">{card.label}</p>
              <p className="mt-2 text-[32px] font-semibold leading-none text-[#1E293B]">{card.value}</p>
              <p className="mt-2 text-[12px] leading-5 text-[#607B90]">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {CAPABILITY_GROUPS.map(group => (
          <article
            key={group.title}
            className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]"
          >
            <h3 className="text-[20px] font-semibold leading-none text-[#1E293B]">{group.title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#607B90]">{group.summary}</p>
            <div className="mt-4 space-y-2">
              {group.links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 text-[13px] font-semibold text-[#1E293B] transition hover:border-[#0F67AE] hover:bg-[#EEF6FF]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-[22px] font-semibold leading-none text-[#1E293B]">Missing Components From Scope</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#607B90]">
                These routes close the biggest operational gaps between the original dashboard and the requirements you provided.
              </p>
            </div>
            <Link
              to={APP_ROUTE_PATHS.adminTaxonomiesManagement}
              className="inline-flex h-10 shrink-0 items-center justify-center self-start whitespace-nowrap rounded-md bg-[#0F67AE] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0B578F]"
            >
              Open Intelligence Core
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PRIORITY_ROUTES.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 transition hover:border-[#0F67AE] hover:bg-[#EEF6FF]"
              >
                <p className="text-[15px] font-semibold text-[#1E293B]">{item.title}</p>
                <p className="mt-2 text-[12px] leading-5 text-[#607B90]">{item.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <aside className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <h3 className="text-[20px] font-semibold leading-none text-[#1E293B]">Current Operations</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#607B90]">
            The original operational basics remain active and have been regrouped into the broader dashboard structure.
          </p>
          <div className="mt-4 grid gap-2">
            {CURRENT_SECTION_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 text-[13px] font-semibold text-[#1E293B] transition hover:border-[#0F67AE] hover:bg-[#EEF6FF]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
