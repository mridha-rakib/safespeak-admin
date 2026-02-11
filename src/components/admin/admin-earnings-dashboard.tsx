import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

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
  { id: "01", name: "Robert Fox", date: "15/09/2024", payOn: "Stripe", trId: "TRX-84921A", amount: "$ 20.99" },
  { id: "01", name: "Robert Fox", date: "15/09/2024", payOn: "Stripe", trId: "TRX-84921A", amount: "$ 20.99" },
  { id: "01", name: "Robert Fox", date: "15/09/2024", payOn: "Stripe", trId: "TRX-84921A", amount: "$ 20.99" },
  { id: "01", name: "Robert Fox", date: "15/09/2024", payOn: "Stripe", trId: "TRX-84921A", amount: "$ 20.99" },
] as const;

const MAX_GROWTH_VALUE = 1600;

export function AdminEarningsDashboard() {
  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <h2 className="text-[44px] font-semibold leading-none text-white">Earnings</h2>
      </div>

      <div className="min-h-[903px] px-4 pb-4 pt-4">
        <div className="rounded-lg border border-[#D4DFEA] bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[18px] font-semibold text-[#1E4B63]">User growth</p>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded bg-[#0F67AE] px-2 text-[10px] font-semibold text-white transition hover:bg-[#0A5792] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              2024
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
                    <div key={index} className="border-b border-dashed border-[#C9D5E0]" />
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

        <h3 className="mt-5 text-[32px] font-semibold leading-none text-[#1E4B63]">Last Transections history</h3>

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
              {TRANSACTIONS.map((transaction, index) => (
                <tr key={`${transaction.trId}-${index}`} className="border-b border-[#DFE7EF] text-[14px] text-[#2E4F66]">
                  <td className="px-3 py-2.5">{transaction.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#DFEAF4] text-[10px] font-semibold text-[#0F67AE]">
                        RF
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
            <p>SHOWING 1-8 OF 250</p>
            <div className="flex items-center gap-2 text-[#607B90]">
              <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[#EDF5FC]">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-[#0F67AE] px-1 text-white">1</button>
              <button type="button" className="inline-flex h-6 min-w-6 items-center justify-center rounded px-1 hover:bg-[#EDF5FC]">2</button>
              <button type="button" className="inline-flex h-6 min-w-6 items-center justify-center rounded px-1 hover:bg-[#EDF5FC]">3</button>
              <span>4....30</span>
              <button type="button" className="inline-flex h-6 min-w-6 items-center justify-center rounded px-1 hover:bg-[#EDF5FC]">60</button>
              <button type="button" className="inline-flex h-6 min-w-6 items-center justify-center rounded px-1 hover:bg-[#EDF5FC]">120</button>
              <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[#EDF5FC]">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
