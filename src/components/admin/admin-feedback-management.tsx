import { CalendarDays, ChevronDown, Eye } from "lucide-react";
import { useState } from "react";

type FeedbackItem = {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  phone: string;
  message: string;
};

const FEEDBACK_ITEMS: FeedbackItem[] = [
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Vel et commodo et scelerisque aliquam. Sed libero, non praesent felis, sem eget venenatis neque.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Tempor at nisl eu mauris lectus. Amet lobortis auctor at egestas aenean.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Rhoncus cras nunc lectus morbi dui sem diam.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Sed gravida eget semper vulputate vitae.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Vel et commodo et scelerisque aliquam.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Sed libero, non praesent felis, sem eget venenatis neque.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Tempor at nisl eu mauris lectus.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Amet lobortis auctor at egestas aenean.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Rhoncus cras nunc lectus morbi dui sem diam.",
  },
  {
    id: "01",
    name: "Robert Fox",
    email: "fox@email",
    joinedDate: "02-24-2024",
    phone: "+12313412",
    message: "Sed gravida eget semper vulputate vitae.",
  },
];

export function AdminFeedbackManagement() {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  return (
    <>
      <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
        <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
          <h2 className="text-[44px] font-semibold leading-none text-white">Report Management</h2>
        </div>

        <div className="min-h-[903px] px-3 pb-3 pt-2 sm:px-4">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded border border-[#A9C0D7] bg-white px-2.5 text-[11px] font-medium text-[#1E293B] transition hover:bg-[#F6FAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Date
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
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
                {FEEDBACK_ITEMS.map((item, index) => (
                  <tr key={`${item.email}-${index}`} className="text-[13px] text-[#28495F]">
                    <td className="px-3 py-2.5">{item.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#DFEAF4] text-[10px] font-semibold text-[#0F67AE]">
                          RF
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
                    JD
                  </span>
                  <p className="text-[22px] font-semibold text-[#1E293B]">John Doe</p>
                </div>

                <dl className="mt-3 space-y-2 text-[14px]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-[#1E3A4F]">Name</dt>
                    <dd className="text-[#486173]">John Doe</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-[#1E3A4F]">Email</dt>
                    <dd className="text-[#486173]">john@email.com</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-[#1E3A4F]">Phone</dt>
                    <dd className="text-[#486173]">{selectedFeedback.phone}</dd>
                  </div>
                  <div className="grid gap-1.5 pt-1">
                    <dt className="font-semibold text-[#1E3A4F]">Message details</dt>
                    <dd className="rounded border border-[#E2EBF4] bg-[#F9FCFF] p-2.5 text-[13px] leading-[1.4] text-[#486173]">
                      {selectedFeedback.message}
                      {" "}
                      Vel et commodo et scelerisque aliquam. Sed libero, non praesent felis, sem eget venenatis neque.
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
