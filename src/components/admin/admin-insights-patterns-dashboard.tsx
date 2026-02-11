import { TrendingDown, TrendingUp } from "lucide-react";

const PATTERN_BARS = [
  { label: "Impersonation", value: 350, color: "from-[#6366F1] to-[#4F46E5]" },
  { label: "Urgency Requests", value: 290, color: "from-[#A855F7] to-[#8B5CF6]" },
  { label: "Fake Invoices", value: 235, color: "from-[#06B6D4] to-[#0EA5E9]" },
  { label: "Account Compromise", value: 190, color: "from-[#14B8A6] to-[#0D9488]" },
  { label: "Payment Fraud", value: 155, color: "from-[#F59E0B] to-[#F97316]" },
] as const;

const RED_FLAG_SERIES = [
  { label: "Urgency Language", value: 63 },
  { label: "Suspicious Domains", value: 54 },
  { label: "Payment Requests", value: 46 },
  { label: "Link Misdirection", value: 41 },
  { label: "Username Issues", value: 34 },
] as const;

const INSIGHT_CARDS = [
  {
    title: "Impersonation Attempts",
    body: "Higher frequency of identity-based deception patterns detected.",
    delta: "VS PREVIOUS WEEK",
    direction: "up",
  },
  {
    title: "Urgency Language",
    body: "Consistent use of time-pressure tactics across incidents.",
    delta: "VS PREVIOUS WEEK",
    direction: "up",
  },
  {
    title: "Domain Spoofing",
    body: "Decreased activity in suspicious sender domain patterns.",
    delta: "VS PREVIOUS WEEK",
    direction: "down",
  },
] as const;

function maxPatternValue() {
  return Math.max(...PATTERN_BARS.map(item => item.value));
}

function maxRedFlagValue() {
  return Math.max(...RED_FLAG_SERIES.map(item => item.value));
}

export function AdminInsightsPatternsDashboard() {
  const patternMax = maxPatternValue();
  const redFlagMax = maxRedFlagValue();

  return (
    <div className="space-y-[18px]">
      <section className="grid gap-3 xl:grid-cols-[2.1fr_1fr]">
        <article className="rounded-xl border border-[#D8E3EE] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[23px] font-semibold leading-none text-[#1E293B]">Common Scam Patterns</h3>
            <span className="rounded bg-[#DFF7EA] px-2 py-1 text-[10px] font-semibold text-[#078838]">
              ↑ 8% from last period
            </span>
          </div>

          <div className="space-y-3">
            {PATTERN_BARS.map(item => (
              <div key={item.label} className="grid grid-cols-[125px_1fr_34px] items-center gap-3">
                <span className="text-[10px] font-medium text-[#607B90]">{item.label}</span>
                <div className="h-8 rounded-full bg-[#E8EEF5] p-0.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    style={{ width: `${(item.value / patternMax) * 100}%` }}
                  />
                </div>
                <span className="text-right text-[10px] font-semibold text-[#1E293B]">{item.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#D8E3EE] bg-white p-4">
          <h3 className="text-[23px] font-semibold leading-none text-[#1E293B]">Risk Score Distribution</h3>

          <div className="mt-4 flex items-center justify-center">
            <div
              className="relative h-[160px] w-[160px] rounded-full"
              style={{
                background: "conic-gradient(#D9DEE4 0deg 234deg, #F4B000 234deg 334deg, #E53935 334deg 360deg)",
              }}
            >
              <div className="absolute inset-[18px] rounded-full bg-white" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[34px] font-bold leading-none text-[#1E293B]">100%</span>
                <span className="mt-1 text-[9px] font-semibold text-[#607B90]">TOTAL</span>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-[11px]">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#607B90]">
                <span className="h-2 w-2 rounded-full bg-[#D9DEE4]" />
                Low Risk
              </span>
              <span className="font-semibold text-[#1E293B]">65%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#607B90]">
                <span className="h-2 w-2 rounded-full bg-[#F4B000]" />
                Medium Risk
              </span>
              <span className="font-semibold text-[#1E293B]">28%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#607B90]">
                <span className="h-2 w-2 rounded-full bg-[#E53935]" />
                High Risk
              </span>
              <span className="font-semibold text-[#1E293B]">7%</span>
            </li>
          </ul>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-xl border border-[#D8E3EE] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[23px] font-semibold leading-none text-[#1E293B]">Red-Flag Frequency</h3>
            <span className="text-[16px] font-semibold text-[#94A3B8]">◌</span>
          </div>

          <div className="h-[250px] rounded-lg bg-[#F8FBFF] p-3">
            <svg viewBox="0 0 500 190" className="h-full w-full">
              <path
                d="M40,140 L130,110 L220,122 L310,85 L400,95"
                fill="none"
                stroke="#0F67AE"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {RED_FLAG_SERIES.map((item, index) => {
                const x = 40 + index * 90;
                const y = 150 - (item.value / redFlagMax) * 70;

                return (
                  <g key={item.label}>
                    <circle cx={x} cy={y} r="4.5" fill="#0F67AE" />
                    <text x={x} y="176" textAnchor="middle" fontSize="9" fill="#607B90" transform={`rotate(22 ${x} 176)`}>
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </article>

        <article className="rounded-xl border border-[#D8E3EE] bg-white p-4">
          <h3 className="text-[23px] font-semibold leading-none text-[#1E293B]">Pattern Insights</h3>
          <div className="mt-3 space-y-2.5">
            {INSIGHT_CARDS.map(item => (
              <section key={item.title} className="rounded-lg border border-[#D8E3EE] bg-[#F8FBFF] px-3 py-2.5">
                <p className="text-[16px] font-semibold text-[#1E293B]">{item.title}</p>
                <p className="mt-1 text-[11px] text-[#607B90]">{item.body}</p>
                <div className="mt-2 flex items-center gap-1 text-[9px] font-semibold">
                  {item.direction === "up"
                    ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-[#078838]" />
                          <span className="text-[#078838]">{item.delta}</span>
                        </>
                      )
                    : (
                        <>
                          <TrendingDown className="h-3 w-3 text-[#E73908]" />
                          <span className="text-[#E73908]">{item.delta}</span>
                        </>
                      )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
