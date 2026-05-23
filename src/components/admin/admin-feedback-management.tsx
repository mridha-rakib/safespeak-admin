import { listAdminFeedback, type AdminFeedbackRecord } from "@/lib/admin-feedback";
import { CalendarDays, ChevronDown, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FeedbackItem = {
  recordId: string;
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  phone: string;
  message: string;
  createdAt?: string;
};

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function toFeedbackItem(record: AdminFeedbackRecord, index: number): FeedbackItem {
  const recordId = record._id ?? record.id ?? String(index);

  return {
    recordId,
    id: String(index + 1).padStart(2, "0"),
    name: record.name || "SafeSpeak user",
    email: record.email || "Not provided",
    joinedDate: record.joinedDate || formatDate(record.createdAt),
    phone: record.phone || "Not provided",
    message: record.message || record.subject || "No message provided.",
    createdAt: record.createdAt,
  };
}

function getSortTime(item: FeedbackItem) {
  if (!item.createdAt) {
    return 0;
  }

  const time = Date.parse(item.createdAt);

  return Number.isNaN(time) ? 0 : time;
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "SS";
}

export function AdminFeedbackManagement() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isNewestFirst, setIsNewestFirst] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void listAdminFeedback({ limit: 100 })
      .then((records) => {
        if (isMounted) {
          setFeedbackItems(records.map(toFeedbackItem));
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeedbackItems([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const orderedFeedback = useMemo(() => [...feedbackItems].sort((left, right) => {
    const sortDirection = isNewestFirst ? -1 : 1;
    const timeComparison = getSortTime(left) - getSortTime(right);

    if (timeComparison !== 0) {
      return timeComparison * sortDirection;
    }

    return isNewestFirst
      ? right.id.localeCompare(left.id)
      : left.id.localeCompare(right.id);
  }), [feedbackItems, isNewestFirst]);

  return (
    <>
      <div className="w-full min-w-0 rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
        <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
          <h2 className="admin-panel-title font-semibold leading-none text-white">Report Management</h2>
        </div>

        <div className="admin-panel-min-h px-3 pb-3 pt-2 sm:px-4">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsNewestFirst(prev => !prev)}
              className="inline-flex h-8 items-center gap-1 rounded border border-[#A9C0D7] bg-white px-2.5 text-[11px] font-medium text-[#1E293B] transition hover:bg-[#F6FAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {isNewestFirst ? "Newest First" : "Oldest First"}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-full lg:min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-[#8EAFCC] text-left text-[12px] font-medium text-[#3A5E77]">
                  <th className="px-3 py-2">S.ID</th>
                  <th className="px-3 py-2">Full Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Joined Date</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orderedFeedback.map(item => (
                  <tr key={item.recordId} className="text-[13px] text-[#28495F]">
                    <td className="px-3 py-2.5">{item.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#DFEAF4] text-[10px] font-semibold text-[#0F67AE]">
                          {getInitials(item.name)}
                        </span>
                        {item.name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{item.email}</td>
                    <td className="px-3 py-2.5">{item.joinedDate}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedFeedback(item)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#1C4D69] transition hover:bg-[#EDF5FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
                        aria-label={`View feedback from ${item.name}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedFeedback
        ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 p-4">
              <div className="w-full max-w-[430px] rounded-md border border-[#D6DFEA] bg-white p-4 shadow-xl">
                <h3 className="text-center text-[42px] font-semibold leading-none text-[#1E4B63]">
                  Feedback Details
                </h3>
                <div className="mt-3 flex items-center gap-2 border-b border-[#E1EAF3] pb-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#DFEAF4] text-[11px] font-semibold text-[#0F67AE]">
                    {getInitials(selectedFeedback.name)}
                  </span>
                  <p className="text-[22px] font-semibold text-[#1E293B]">{selectedFeedback.name}</p>
                </div>

                <dl className="mt-3 space-y-2 text-[14px]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-[#1E3A4F]">Name</dt>
                    <dd className="text-[#486173]">{selectedFeedback.name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-[#1E3A4F]">Email</dt>
                    <dd className="text-[#486173]">{selectedFeedback.email}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-[#1E3A4F]">Phone</dt>
                    <dd className="text-[#486173]">{selectedFeedback.phone}</dd>
                  </div>
                  <div className="grid gap-1.5 pt-1">
                    <dt className="font-semibold text-[#1E3A4F]">Message details</dt>
                    <dd className="rounded border border-[#E2EBF4] bg-[#F9FCFF] p-2.5 text-[13px] leading-[1.4] text-[#486173]">
                      {selectedFeedback.message}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="mt-4 h-8 w-full rounded-sm border border-[#9CB4C8] text-[12px] font-semibold text-[#3D5A73] transition hover:bg-[#F4F8FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        : null}
    </>
  );
}
