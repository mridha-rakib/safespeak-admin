import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const SUBSCRIPTIONS = [
  { id: "01", user: "Robert Fox", email: "fox@email", status: "Paid", plan: "Monthly", expirationDate: "02-24-2024" },
  { id: "02", user: "Robert Fox", email: "fox@email", status: "Paid", plan: "Monthly", expirationDate: "02-24-2024" },
  { id: "03", user: "Robert Fox", email: "fox@email", status: "Paid", plan: "Monthly", expirationDate: "02-24-2024" },
  { id: "04", user: "Robert Fox", email: "fox@email", status: "Expired", plan: "6 Months", expirationDate: "02-24-2024" },
  { id: "05", user: "Robert Fox", email: "fox@email", status: "Expired", plan: "6 Months", expirationDate: "02-24-2024" },
  { id: "06", user: "Robert Fox", email: "fox@email", status: "Expired", plan: "6 Months", expirationDate: "02-24-2024" },
  { id: "07", user: "Robert Fox", email: "fox@email", status: "Expired", plan: "Yearly", expirationDate: "02-24-2024" },
  { id: "08", user: "Robert Fox", email: "fox@email", status: "Expired", plan: "Yearly", expirationDate: "02-24-2024" },
  { id: "09", user: "Robert Fox", email: "fox@email", status: "Expired", plan: "Yearly", expirationDate: "02-24-2024" },
  { id: "10", user: "Robert Fox", email: "fox@email", status: "Expired", plan: "Yearly", expirationDate: "02-24-2024" },
] as const;

export function AdminSubscriptionsDashboard() {
  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-3 rounded-t-xl bg-[#0F67AE] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="admin-panel-title font-semibold leading-none text-white">Subscriptions</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-auto">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8AA2B5]"
              aria-hidden="true"
            />
            <Input
              placeholder="Search User"
              className="h-9 w-full rounded-md border border-transparent bg-white pl-8 text-[12px] text-[#1E293B] shadow-none focus-visible:ring-[#4BA3D9] sm:w-[260px]"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-9 rounded-md border border-[#DDE6EF] bg-white px-4 text-[13px] font-semibold text-[#0F67AE] hover:bg-[#F2F7FD] sm:w-auto"
          >
            Manages Fees
          </Button>
        </div>
      </div>

      <div className="admin-panel-min-h px-3 pb-3 pt-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b border-[#AFC4D8] text-left text-[12px] font-medium text-[#3A5E77]">
                <th className="px-3 py-2">S.ID</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Staus</th>
                <th className="px-3 py-2">Plans</th>
                <th className="px-3 py-2">Expiration Date</th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTIONS.map(subscription => (
                <tr key={subscription.id} className="border-b border-[#E1EAF3] text-[13px] text-[#2E4F66]">
                  <td className="px-3 py-2.5">{subscription.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#DFEAF4] text-[10px] font-semibold text-[#0F67AE]">
                        RF
                      </span>
                      {subscription.user}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{subscription.email}</td>
                  <td className={`px-3 py-2.5 ${subscription.status === "Paid" ? "text-[#18A55A]" : "text-[#EF4444]"}`}>
                    {subscription.status}
                  </td>
                  <td className="px-3 py-2.5">{subscription.plan}</td>
                  <td className="px-3 py-2.5">{subscription.expirationDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-2 px-1 text-[11px] font-medium text-[#0F67AE] sm:flex-row sm:items-center sm:justify-between">
          <p>SHOWING 1-8 OF 250</p>
          <div className="flex flex-wrap items-center gap-2 text-[#607B90] sm:justify-end">
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
  );
}
