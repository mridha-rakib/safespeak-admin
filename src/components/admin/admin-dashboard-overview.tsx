import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

const STATS = [
  {
    label: "TOTAL USER SESSIONS",
    value: "12,482",
    delta: "+12% vs last week",
    tone: "text-[#078838]",
    trend: "up",
  },
  {
    label: "ACTIVE SESSIONS",
    value: "842",
    delta: "+5% realtime",
    tone: "text-[#078838]",
    trend: "up",
  },
  {
    label: "RESPONSE RATE",
    value: "98.2%",
    delta: "-0.4% vs avg",
    tone: "text-[#E73908]",
    trend: "down",
  },
] as const;

type DashboardRangeKey = "24h" | "7d" | "30d" | "90d";

const RANGE_TABS = [
  { key: "24h", label: "Last 24h" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
] as const;

const MICRO_STATS = [
  { label: "AVG SESSION", value: "14m 22s" },
  { label: "PEAK CONCURRENT", value: "1,204" },
  { label: "UPTIME", value: "99.99%" },
  { label: "API REQUESTS", value: "4.2M" },
] as const;

type AdminDashboardOverviewProps = {
  title?: string;
  description?: string;
};

export function AdminDashboardOverview({
  title = "Dashboard Overview",
  description = "Track platform activity, user sessions, and operational health in one place.",
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-[#607B90]">
            Admin
            {"  >  "}
            Minimalist Sanctuary
          </p>
          <h2 className="text-[34px] font-medium leading-none text-[#1E293B]">{title}</h2>
          <p className="text-sm text-[#607B90]">{description}</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[#D8E3EE] bg-[#F9FCFF] px-3 py-2 text-xs text-[#1E293B]">
          <span className="h-2 w-2 rounded-full bg-[#01579B]" />
          <span className="font-medium">
            System Health:
            {" "}
            <span className="text-[#0F67AE]">Operating normally</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-7 border-b border-[#D6E0EB] pb-2">
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

      <div className="grid gap-4 lg:grid-cols-3">
        {STATS.map(stat => (
          <article
            key={stat.label}
            className="rounded-xl border border-[#D6DFEA] bg-white p-4 shadow-[inset_0_-35px_0_rgba(244,248,252,0.7)]"
          >
            <p className="text-xs font-semibold tracking-wide text-[#607B90]">{stat.label}</p>
            <p className="mt-2 text-[52px] font-light leading-none text-[#1E293B]">{stat.value}</p>
            <p className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${stat.tone}`}>
              {stat.trend === "up"
                ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  )
                : (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
              <span>{stat.delta}</span>
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="rounded-xl border border-[#D6DFEA] bg-white p-4">
          <h3 className="text-[30px] font-semibold leading-none text-[#1E293B]">Session Volume Over Time</h3>
          <p className="mt-1 text-xs text-[#607B90]">Aggregate user activity across all regions</p>
          <div className="mt-4 h-[280px] rounded-lg bg-[#F8FBFF] px-4 py-5">
            <svg viewBox="0 0 600 220" className="h-full w-full">
              <path
                d="M15,170 C70,110 120,190 180,145 C250,80 300,20 360,145 C420,240 490,160 575,30"
                fill="none"
                stroke="#0B65B5"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="mt-2 grid grid-cols-7 text-[10px] font-semibold text-[#607B90]">
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
              <span>SUN</span>
            </div>
          </div>
        </article>

        <div className="grid gap-4">
          <article className="rounded-xl border border-[#D6DFEA] bg-white p-4">
            <h3 className="text-[20px] font-bold text-[#111827]">GUIDANCE DISTRIBUTION</h3>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E2ECF7]">
              <div className="h-full w-[65%] bg-[#0F67AE]" />
            </div>
            <ul className="mt-4 space-y-2 text-xs text-[#607B90]">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0F67AE]" />
                  Completed Paths
                </span>
                <span className="font-semibold text-[#1E293B]">65%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#6B9FC9]" />
                  In-Progress
                </span>
                <span className="font-semibold text-[#1E293B]">20%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#A9C3DD]" />
                  Drop-offs
                </span>
                <span className="font-semibold text-[#1E293B]">15%</span>
              </li>
            </ul>
          </article>

          <article className="rounded-xl border border-[#D6DFEA] bg-white p-4">
            <h3 className="text-[20px] font-bold text-[#111827]">NOTABLE PATTERNS</h3>
            <ul className="mt-3 space-y-3 text-xs text-[#607B90]">
              <li>
                <p className="font-semibold text-[#1E293B]">Late Night Surge</p>
                <p>Increased night-time activity from APAC region detected.</p>
              </li>
              <li>
                <p className="font-semibold text-[#1E293B]">Mobile Engagement</p>
                <p>High engagement observed on iOS devices during weekends.</p>
              </li>
              <li>
                <p className="font-semibold text-[#1E293B]">Response Latency</p>
                <p>System response time slightly elevated in EU Central.</p>
              </li>
            </ul>
          </article>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MICRO_STATS.map(item => (
          <article key={item.label} className="rounded-lg border border-[#D6DFEA] bg-white p-4">
            <p className="text-[10px] font-semibold text-[#607B90]">{item.label}</p>
            <p className="mt-2 text-[28px] leading-none text-[#1E293B]">{item.value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
