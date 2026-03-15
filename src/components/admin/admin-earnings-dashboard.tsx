import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const USER_GROWTH_BY_MONTH = [
  { month: "Jan", value: 760 },
  { month: "Feb", value: 260 },
  { month: "Mar", value: 920 },
  { month: "Apr", value: 560 },
  { month: "May", value: 420 },
  { month: "Jun", value: 740 },
  { month: "Jul", value: 310 },
  { month: "Aug", value: 520 },
  { month: "Sep", value: 620 },
  { month: "Oct", value: 860 },
  { month: "Nov", value: 180 },
  { month: "Dec", value: 700 },
] as const;

const TRANSACTIONS = [
  { id: "01", name: "Robert Fox", date: "15/09/2024", payOn: "Stripe", trId: "TRX-84921A", amount: "$ 20.99" },
  { id: "02", name: "Alina Rahman", date: "16/09/2024", payOn: "Stripe", trId: "TRX-84921B", amount: "$ 18.50" },
  { id: "03", name: "Mina Patel", date: "16/09/2024", payOn: "PayPal", trId: "TRX-84921C", amount: "$ 12.90" },
  { id: "04", name: "Jonas Lee", date: "17/09/2024", payOn: "Stripe", trId: "TRX-84921D", amount: "$ 20.99" },
  { id: "05", name: "Amina Noor", date: "17/09/2024", payOn: "Stripe", trId: "TRX-84921E", amount: "$ 19.20" },
  { id: "06", name: "Sara Morgan", date: "18/09/2024", payOn: "Apple Pay", trId: "TRX-84921F", amount: "$ 20.99" },
] as const;

const YEARS = ["2024", "2025", "2026"] as const;
const MAX_GROWTH_VALUE = 1600;
const PAGE_SIZE = 3;

export function AdminEarningsDashboard() {
  const [activeYear, setActiveYear] = useState<(typeof YEARS)[number]>("2024");
  const [activePage, setActivePage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(TRANSACTIONS.length / PAGE_SIZE));
  const visibleTransactions = useMemo(
    () => TRANSACTIONS.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE),
    [activePage],
  );

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <h2 className="admin-panel-title font-semibold leading-none text-white">Earnings</h2>
      </div>

      <div className="admin-panel-min-h px-4 pb-4 pt-4">
        <div className="rounded-lg border border-[#D4DFEA] bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[18px] font-semibold text-[#1E4B63]">User growth</p>
              <p className="text-[11px] text-[#607B90]">Year toggle and pagination are interactive.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveYear(YEARS[(YEARS.indexOf(activeYear) + 1) % YEARS.length])}
              className="inline-flex h-7 items-center gap-1 rounded bg-[#0F67AE] px-2 text-[10px] font-semibold text-white transition hover:bg-[#0A5792] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              {activeYear}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-[34px_1fr] gap-2">
            <div className="flex h-[220px] flex-col justify-between text-[9px] font-medium text-[#607B90]">
              <span>1600</span>
              <span>800</span>
              <span>400</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>
            <div className="space-y-2">
              <div className="relative h-[220px]">
                <div className="absolute inset-0 grid grid-rows-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={`grid-line-${index + 1}`} className="border-b border-dashed border-[#C9D5E0]" />
                  ))}
                </div>

                <div className="relative z-10 flex h-full items-end gap-2">
                  {USER_GROWTH_BY_MONTH.map(item => (
                    <div key={item.month} className="flex h-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-[3px] bg-[#2E6FA0]"
                        style={{ height: `${Math.max(8, (item.value / MAX_GROWTH_VALUE) * 100)}%` }}
                        aria-label={`${item.month} growth ${item.value}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-12 text-center text-[10px] font-medium text-[#607B90]">
                {USER_GROWTH_BY_MONTH.map(item => (
                  <span key={`${item.month}-label`}>{item.month}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h3 className="mt-5 text-[32px] font-semibold leading-none text-[#1E4B63]">Transaction History</h3>

        <div className="mt-3 overflow-hidden rounded-lg border border-[#CAD7E3]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0F67AE] text-left text-[15px] font-medium text-white">
                <th className="px-3 py-2">S.ID</th>
                <th className="px-3 py-2">Full Name</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Pay on</th>
                <th className="px-3 py-2">TR ID</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map(transaction => (
                <tr key={transaction.trId} className="border-b border-[#DFE7EF] text-[14px] text-[#2E4F66]">
                  <td className="px-3 py-2.5">{transaction.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#DFEAF4] text-[10px] font-semibold text-[#0F67AE]">
                        {transaction.name.slice(0, 2).toUpperCase()}
                      </span>
                      {transaction.name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{transaction.date}</td>
                  <td className="px-3 py-2.5">{transaction.payOn}</td>
                  <td className="px-3 py-2.5">{transaction.trId}</td>
                  <td className="px-3 py-2.5">{transaction.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium text-[#0F67AE]">
            <p>
              SHOWING
              {" "}
              {(activePage - 1) * PAGE_SIZE + 1}
              -
              {Math.min(activePage * PAGE_SIZE, TRANSACTIONS.length)}
              {" OF "}
              {TRANSACTIONS.length}
            </p>
            <div className="flex items-center gap-2 text-[#607B90]">
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setActivePage(prev => Math.max(1, prev - 1))}
                className="inline-flex h-6 w-6 items-center justify-center rounded transition enabled:hover:bg-[#EDF5FC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setActivePage(pageNumber)}
                    className={pageNumber === activePage
                      ? "inline-flex h-6 min-w-6 items-center justify-center rounded bg-[#0F67AE] px-1 text-white"
                      : "inline-flex h-6 min-w-6 items-center justify-center rounded px-1 transition hover:bg-[#EDF5FC]"
                    }
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setActivePage(prev => Math.min(totalPages, prev + 1))}
                className="inline-flex h-6 w-6 items-center justify-center rounded transition enabled:hover:bg-[#EDF5FC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
