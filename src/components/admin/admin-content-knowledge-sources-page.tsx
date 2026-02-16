import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { Plus, RefreshCcw } from "lucide-react";

const KNOWLEDGE_SOURCES = [
  {
    sourceName: "New Cyber Policy 2024",
    category: "Legislation",
    age: "2 mins ago",
    status: "Ingested",
  },
  {
    sourceName: "Phishing Pattern: Crypto-Romance",
    category: "Scam Pattern",
    age: "1 hour ago",
    status: "Pending Review",
  },
  {
    sourceName: "GDPR Amendment v3.2",
    category: "Regulation",
    age: "Yesterday",
    status: "Ingested",
  },
] as const;

function categoryClass(category: string) {
  if (category === "Legislation") {
    return "bg-[#E5ECFF] text-[#3B5BCC]";
  }
  if (category === "Scam Pattern") {
    return "bg-[#FFE8EA] text-[#D14343]";
  }
  return "bg-[#EFE3FF] text-[#7C3AED]";
}

function ingestionClass(status: string) {
  if (status === "Ingested") {
    return "bg-[#DCFCE7] text-[#0F7A43]";
  }
  return "bg-[#FFF0D9] text-[#B45309]";
}

export function AdminContentKnowledgeSourcesPage() {
  return (
    <AdminContentManagementShell>
      <section className="space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] font-semibold text-[#1E293B]">Recent Knowledge Sources</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E3EE] bg-white px-3 text-[11px] font-semibold text-[#334155]"
            >
              <RefreshCcw className="h-3 w-3" />
              Re-scan Sources
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#F59E0B] px-3 text-[11px] font-semibold text-white"
            >
              <Plus className="h-3 w-3" />
              Add New Source
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[10px] border border-[#D5DEE7]">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead className="bg-[#F8FBFF]">
              <tr className="text-[10px] uppercase tracking-wide text-[#607B90]">
                <th className="px-3 py-2 font-semibold">Source Name</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Date Added</th>
                <th className="px-3 py-2 font-semibold">Ingestion Status</th>
              </tr>
            </thead>
            <tbody>
              {KNOWLEDGE_SOURCES.map(row => (
                <tr key={row.sourceName} className="border-t border-[#E4EAF1] text-[12px] text-[#1E293B]">
                  <td className="px-3 py-2.5">{row.sourceName}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryClass(row.category)}`}>{row.category}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[#607B90]">{row.age}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ingestionClass(row.status)}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="rounded-[10px] border border-[#D8E3EE]">
          <div className="border-b border-[#E4EAF1] px-3 py-2">
            <h3 className="text-sm font-semibold text-[#1E293B]">Explanation Template Editor</h3>
            <p className="mt-0.5 text-[11px] text-[#607B90]">
              Editing response for:
              {" "}
              <span className="font-medium text-[#0F67AE]">Phishing Pattern: Crypto-Romance</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <button type="button" className="rounded border border-[#0F67AE] bg-[#EEF6FF] px-2 py-0.5 font-medium text-[#0F67AE]">Risk Phrasing</button>
              <button type="button" className="rounded border border-[#D8E3EE] px-2 py-0.5 text-[#607B90]">Disclaimer Phrasing</button>
              <button type="button" className="rounded border border-[#D8E3EE] px-2 py-0.5 text-[#607B90]">General Responses</button>
            </div>
          </div>

          <div className="border-b border-[#E4EAF1] px-3 py-2 text-[10px] text-[#607B90]">
            VARIABLES
            <span className="ml-2 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[#1D4ED8]">{`{User_Name}`}</span>
            <span className="ml-1 rounded bg-[#FFE4E6] px-1.5 py-0.5 text-[#BE123C]">{`{Scam_Type}`}</span>
            <span className="ml-1 rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[#15803D]">{`{Risk_Level}`}</span>
          </div>

          <textarea
            rows={9}
            readOnly
            value={`Based on recent reports of {Scam_Type}, we have identified a high probability of fraudulent activity.\n\nThis pattern typically involves long-term emotional manipulation followed by requests for cryptocurrency transfers.\n\nRecommendation: Cease all communication immediately. Do not transfer any funds. The platform advises users to report this profile.`}
            className="w-full resize-none rounded-b-[10px] bg-white px-3 py-3 text-sm leading-6 text-[#334155]"
          />
        </section>

        <div className="flex flex-col gap-2 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#94A3B8]">Last auto-saved 10 seconds ago</p>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex h-8 items-center rounded-md border border-[#D8E3EE] bg-white px-3 font-semibold text-[#334155]">
              Save Draft
            </button>
            <button type="button" className="inline-flex h-8 items-center rounded-md bg-[#F59E0B] px-3 font-semibold text-white">
              Publish Update
            </button>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
