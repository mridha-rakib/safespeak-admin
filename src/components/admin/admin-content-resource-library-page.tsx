import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { MoreVertical, Plus, Search, Upload } from "lucide-react";

const RESOURCE_ROWS = [
  {
    name: "Legal Rights Guide 2024 Update",
    size: "1.4MB",
    language: "English",
    category: "Legal Awareness",
    jurisdiction: "NSW",
    status: "Expiring Soon",
  },
  {
    name: "Coping with Online Abuse",
    size: "4.2MB",
    language: "Arabic",
    category: "Online Abuse",
    jurisdiction: "Federal",
    status: "Active",
  },
  {
    name: "Reporting School Bullying",
    size: "1.9MB",
    language: "Spanish",
    category: "School Safety",
    jurisdiction: "VIC",
    status: "Outdated",
  },
  {
    name: "Identifying Phishing Scams",
    size: "2.1MB",
    language: "English",
    category: "Scams",
    jurisdiction: "Federal",
    status: "Active",
  },
] as const;

function categoryClass(category: string) {
  if (category === "Legal Awareness") {
    return "bg-[#E5ECFF] text-[#1D4ED8]";
  }
  if (category === "Online Abuse") {
    return "bg-[#EFE3FF] text-[#7C3AED]";
  }
  if (category === "School Safety") {
    return "bg-[#FFEAD5] text-[#C2410C]";
  }
  return "bg-[#DCFCE7] text-[#15803D]";
}

function statusClass(status: string) {
  if (status === "Expiring Soon") {
    return "text-[#D97706]";
  }
  if (status === "Outdated") {
    return "text-[#B45309]";
  }
  return "text-[#15803D]";
}

export function AdminContentResourceLibraryPage() {
  return (
    <AdminContentManagementShell>
      <section className="space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[26px] font-semibold leading-none text-[#0F172A] sm:text-[30px]">Resource Library</h3>
            <p className="mt-1 text-xs text-[#607B90]">Manage downloadable assets, training materials, and safety resources.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                readOnly
                value="Search cards..."
                className="h-8 w-full rounded-full border border-[#D8E3EE] bg-white pl-8 pr-3 text-xs text-[#607B90] sm:w-[190px]"
              />
            </label>
            <button type="button" className="inline-flex h-8 items-center gap-1 rounded-full bg-[#F59E0B] px-3 text-[11px] font-semibold text-white">
              <Upload className="h-3.5 w-3.5" />
              Bulk Upload
            </button>
            <button type="button" className="inline-flex h-8 items-center gap-1 rounded-full bg-[#0F67AE] px-3 text-[11px] font-semibold text-white">
              <Plus className="h-3.5 w-3.5" />
              New Resource
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded-full bg-[#EDF5FF] px-2 py-1 font-semibold text-[#0F67AE]">All Resources</span>
          <span className="rounded-full border border-[#D8E3EE] px-2 py-1 text-[#607B90]">Banks</span>
          <span className="rounded-full border border-[#D8E3EE] px-2 py-1 text-[#607B90]">Legal Aid</span>
          <span className="rounded-full border border-[#D8E3EE] px-2 py-1 text-[#607B90]">Counseling</span>
        </div>

        <div className="overflow-x-auto rounded-[10px] border border-[#D5DEE7]">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-[#F8FBFF]">
              <tr className="text-[10px] uppercase tracking-wide text-[#607B90]">
                <th className="px-3 py-2 font-semibold"><input type="checkbox" readOnly /></th>
                <th className="px-3 py-2 font-semibold">Resource / Asset Name</th>
                <th className="px-3 py-2 font-semibold">Language</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Jurisdiction</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCE_ROWS.map(item => (
                <tr key={item.name} className="border-t border-[#E4EAF1] text-[12px] text-[#1E293B]">
                  <td className="px-3 py-2.5"><input type="checkbox" readOnly /></td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[10px] text-[#94A3B8]">{item.size}</p>
                  </td>
                  <td className="px-3 py-2.5 text-[#475569]">{item.language}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryClass(item.category)}`}>{item.category}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[#475569]">{item.jurisdiction}</td>
                  <td className={`px-3 py-2.5 text-[11px] font-semibold ${statusClass(item.status)}`}>
                    {item.status === "Expiring Soon" ? "EXPIRING SOON" : item.status === "Outdated" ? "OUTDATED" : "ACTIVE"}
                  </td>
                  <td className="px-3 py-2.5">
                    <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded text-[#607B90] hover:bg-[#EEF3F8]">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 text-[10px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#607B90]">Showing 1-4 of 142 production resources</p>
          <div className="flex items-center gap-2">
            <button type="button" className="h-7 rounded border border-[#D8E3EE] px-3 text-[#607B90]">Previous</button>
            <button type="button" className="h-7 rounded border border-[#D8E3EE] px-3 text-[#607B90]">Next</button>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
