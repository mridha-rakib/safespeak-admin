import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

const SUBSCRIPTIONS = [
  { id: "01", user: "Robert Fox", email: "fox@email.com", status: "Paid", plan: "Monthly", expirationDate: "02-24-2026" },
  { id: "02", user: "Amina Noor", email: "amina@email.com", status: "Paid", plan: "Monthly", expirationDate: "03-11-2026" },
  { id: "03", user: "Sara Kim", email: "sara@email.com", status: "Paid", plan: "Yearly", expirationDate: "11-02-2026" },
  { id: "04", user: "Jonas Lee", email: "jonas@email.com", status: "Expired", plan: "6 Months", expirationDate: "01-15-2026" },
  { id: "05", user: "Mina Patel", email: "mina@email.com", status: "Expired", plan: "6 Months", expirationDate: "02-01-2026" },
  { id: "06", user: "Liam Green", email: "liam@email.com", status: "Expired", plan: "Yearly", expirationDate: "12-24-2025" },
] as const;

const PAGE_SIZE = 3;

export function AdminSubscriptionsDashboard() {
  const [searchValue, setSearchValue] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>("Subscription controls are active.");

  const filteredSubscriptions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return SUBSCRIPTIONS.filter((subscription) => {
      if (!normalizedSearch) {
        return true;
      }

      return subscription.user.toLowerCase().includes(normalizedSearch)
        || subscription.email.toLowerCase().includes(normalizedSearch)
        || subscription.plan.toLowerCase().includes(normalizedSearch)
        || subscription.status.toLowerCase().includes(normalizedSearch);
    });
  }, [searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / PAGE_SIZE));
  const visibleSubscriptions = filteredSubscriptions.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-3 rounded-t-xl bg-[#0F67AE] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="admin-panel-title font-semibold leading-none text-white">Subscriptions</h2>
          {statusMessage
            ? <p className="mt-2 text-[12px] font-medium text-white/85">{statusMessage}</p>
            : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="relative w-full sm:w-auto">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8AA2B5]"
              aria-hidden="true"
            />
            <Input
              placeholder="Search User"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setActivePage(1);
              }}
              className="h-9 w-full rounded-md border border-transparent bg-white pl-8 text-[12px] text-[#1E293B] shadow-none focus-visible:ring-[#4BA3D9] sm:w-[260px]"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStatusMessage("Fee management panel opened for finance review.")}
            className="h-9 rounded-md border border-[#DDE6EF] bg-white px-4 text-[13px] font-semibold text-[#0F67AE] hover:bg-[#F2F7FD] sm:w-auto"
          >
            Manage Fees
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
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Plans</th>
                <th className="px-3 py-2">Expiration Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubscriptions.map(subscription => (
                <tr key={subscription.id} className="border-b border-[#E1EAF3] text-[13px] text-[#2E4F66]">
                  <td className="px-3 py-2.5">{subscription.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#DFEAF4] text-[10px] font-semibold text-[#0F67AE]">
                        {subscription.user.slice(0, 2).toUpperCase()}
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
              {visibleSubscriptions.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-[#607B90]">
                        No subscriptions matched your search.
                      </td>
                    </tr>
                  )
                : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-2 px-1 text-[11px] font-medium text-[#0F67AE] sm:flex-row sm:items-center sm:justify-between">
          <p>
            SHOWING
            {" "}
            {filteredSubscriptions.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1}
            -
            {Math.min(activePage * PAGE_SIZE, filteredSubscriptions.length)}
            {" OF "}
            {filteredSubscriptions.length}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[#607B90] sm:justify-end">
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
  );
}
