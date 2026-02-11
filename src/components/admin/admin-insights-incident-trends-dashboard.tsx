import { AlertTriangle, CheckCircle2, ShieldAlert, UsersRound } from "lucide-react";

const SUMMARY_CARDS = [
  {
    label: "TOTAL REPORTS",
    value: "1,248",
    footer: "+12%",
    footerText: "vs last 30 days",
    footerTone: "text-[#16A34A]",
    icon: <ShieldAlert className="h-4 w-4 text-[#1677DA]" />,
  },
  {
    label: "AVG. RISK SCORE",
    value: "4.2",
    valueSuffix: "/10",
    footer: "Stable trend",
    badge: "Non-alarming",
    icon: <span className="inline-flex h-3.5 w-3.5 rounded-full bg-[#F97316]" />,
  },
  {
    label: "RESOLVED CASES",
    value: "892",
    progress: 71,
    icon: <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />,
  },
  {
    label: "ACTIVE REVIEWERS",
    value: "14",
    reviewers: ["AB", "JK", "RM"],
    icon: <UsersRound className="h-4 w-4 text-[#A855F7]" />,
  },
] as const;

const HEATMAP_ROWS = ["Phishing", "Harassment", "Spam", "Impersonation", "Malware"] as const;
const HEATMAP_COLS = ["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"] as const;
const HEATMAP_VALUES = [
  [0, 2, 4, 6, 3, 1],
  [1, 1, 2, 5, 7, 4],
  [6, 5, 4, 3, 2, 1],
  [1, 2, 3, 2, 3, 1],
  [2, 3, 2, 1, 1, 0],
] as const;

const RED_FLAGS = [
  { label: "\"Urgent Action\"", value: 34 },
  { label: "\"Account Suspended\"", value: 28 },
  { label: "\"Verify Identity\"", value: 21 },
  { label: "\"Click Here\"", value: 12 },
] as const;

const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese"] as const;
const LANG_VALUES = [92, 63, 58, 38, 28] as const;

function heatCellClass(level: number) {
  if (level >= 7) {
    return "bg-[#1E40AF]";
  }
  if (level >= 6) {
    return "bg-[#2563EB]";
  }
  if (level >= 5) {
    return "bg-[#3B82F6]";
  }
  if (level >= 4) {
    return "bg-[#60A5FA]";
  }
  if (level >= 3) {
    return "bg-[#93C5FD]";
  }
  if (level >= 2) {
    return "bg-[#BFDBFE]";
  }
  if (level >= 1) {
    return "bg-[#DBEAFE]";
  }
  return "bg-[#E6EEF7]";
}

export function AdminInsightsIncidentTrendsDashboard() {
  return (
    <div className="space-y-[18px]">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map(card => (
          <article
            key={card.label}
            className="rounded-xl border border-[#D8E3EE] bg-white px-4 py-3 shadow-[0_1px_4px_rgba(17,24,39,0.06)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">{card.label}</p>
              <span>{card.icon}</span>
            </div>

            <p className="mt-2 flex items-end gap-1 text-[38px] font-semibold leading-none text-[#1E293B]">
              {card.value}
              {"valueSuffix" in card && card.valueSuffix
                ? <span className="pb-1 text-base font-medium text-[#94A3B8]">{card.valueSuffix}</span>
                : null}
            </p>

            {"progress" in card && card.progress
              ? (
                  <div className="mt-3 space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#E4EDF7]">
                      <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${card.progress}%` }} />
                    </div>
                    <p className="text-right text-[10px] font-semibold text-[#16A34A]">{card.progress}%</p>
                  </div>
                )
              : null}

            {"reviewers" in card && card.reviewers
              ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {card.reviewers.map(initials => (
                        <span
                          key={initials}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#D9E5F1] text-[9px] font-bold text-[#1E4B63]"
                        >
                          {initials}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-[#607B90]">+11</span>
                  </div>
                )
              : null}

            {"badge" in card && card.badge
              ? (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#607B90]">
                    <span>{card.footer}</span>
                    <span className="rounded bg-[#DCFCE7] px-1.5 py-0.5 font-semibold text-[#078838]">
                      {card.badge}
                    </span>
                  </div>
                )
              : null}

            {"footerText" in card && card.footerText
              ? (
                  <p className={`mt-3 text-[10px] font-semibold ${card.footerTone ?? "text-[#607B90]"}`}>
                    {card.footer}
                    {" "}
                    <span className="font-medium text-[#94A3B8]">{card.footerText}</span>
                  </p>
                )
              : null}
          </article>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[2fr_1fr]">
        <article className="rounded-xl border border-[#D8E3EE] bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[23px] font-semibold leading-none text-[#1E293B]">Common Scam Patterns</h3>
              <p className="mt-1 text-[11px] text-[#607B90]">Heatmap of report categories vs. time of day.</p>
            </div>
            <button
              type="button"
              className="rounded-md bg-[#E6F0FB] px-3 py-1 text-[10px] font-semibold text-[#1677DA] transition hover:bg-[#DCEAF9]"
            >
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[560px] space-y-2">
              {HEATMAP_ROWS.map((rowName, rowIndex) => (
                <div key={rowName} className="grid grid-cols-[92px_repeat(6,minmax(0,1fr))] items-center gap-1.5">
                  <span className="text-[10px] font-medium text-[#607B90]">{rowName}</span>
                  {HEATMAP_VALUES[rowIndex].map((level, colIndex) => (
                    <span key={`${rowName}-${HEATMAP_COLS[colIndex]}`} className={`h-9 rounded ${heatCellClass(level)}`} />
                  ))}
                </div>
              ))}
              <div className="grid grid-cols-[92px_repeat(6,minmax(0,1fr))] gap-1.5 pt-1">
                <span />
                {HEATMAP_COLS.map(col => (
                  <span key={col} className="text-center text-[10px] font-medium text-[#607B90]">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className="space-y-3">
          <article className="rounded-xl border border-[#D8E3EE] bg-white p-3">
            <h3 className="text-[20px] font-bold leading-none text-[#1E293B]">Red-Flag Frequency</h3>
            <p className="mt-1 text-[10px] text-[#607B90]">Top triggers detected by automated scan.</p>
            <ul className="mt-3 space-y-3">
              {RED_FLAGS.map(item => (
                <li key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#526D82]">
                    <span>{item.label}</span>
                    <span className="font-semibold text-[#1E293B]">{item.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#E2ECF7]">
                    <div className="h-full rounded-full bg-[#1677DA]" style={{ width: `${item.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-[#F5D8C9] bg-[#FFF8F2] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#EA580C]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Insight Detected
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#7A5A45]">
              Scams using urgency keywords have increased
              {" "}
              <span className="font-semibold">by 15%</span>
              {" "}
              this week. Consider updating user alerts.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <article className="rounded-xl border border-[#D8E3EE] bg-white p-3">
          <h3 className="text-[23px] font-semibold leading-none text-[#1E293B]">Top Languages Affected</h3>
          <div className="mt-4 h-[180px]">
            <div className="flex h-full items-end gap-2 rounded-md border border-dashed border-[#D6E0EB] bg-[#FBFDFF] p-3">
              {LANG_VALUES.map((value, index) => (
                <div key={LANGUAGES[index]} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full max-w-[34px] rounded-t bg-gradient-to-t from-[#9DBBE0] to-[#D8E8FA]"
                    style={{ height: `${value}px` }}
                  />
                  <span className="text-[9px] text-[#607B90]">{LANGUAGES[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#D8E3EE] bg-white p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[23px] font-semibold leading-none text-[#1E293B]">Risk Score Distributions</h3>
            <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
          </div>
          <p className="mt-1 text-[10px] text-[#607B90]">Aggregate user base risk assessment.</p>
          <div className="mt-3 h-[185px] rounded-md bg-[#F8FBFF] p-3">
            <svg viewBox="0 0 500 180" className="h-full w-full">
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8FB7F1" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M0,150 C45,145 65,120 105,128 C145,136 160,90 208,82 C250,74 280,102 325,90 C372,78 400,48 440,72 L500,140 L0,140 Z"
                fill="url(#riskGradient)"
              />
            </svg>
            <div className="mt-1 flex justify-between text-[9px] font-medium text-[#607B90]">
              <span>LOW RISK</span>
              <span>MEDIUM RISK</span>
              <span>HIGH RISK</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
