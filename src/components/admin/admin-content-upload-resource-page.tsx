import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { CalendarDays, ChevronDown, CloudUpload } from "lucide-react";

function InputBlock({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
      <input
        type="text"
        readOnly
        value={value}
        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155]"
      />
    </label>
  );
}

function SelectBlock({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155]"
      >
        {value}
        <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
      </button>
    </label>
  );
}

export function AdminContentUploadResourcePage() {
  return (
    <AdminContentManagementShell>
      <section className="space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1E293B]">Upload New Resource</h3>
          <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Add to production library</p>
        </div>

        <InputBlock label="Resource Name" value="e.g. Legal Support Framework 2024" />

        <div className="grid gap-3 md:grid-cols-2">
          <SelectBlock label="Primary Language" value="English" />
          <SelectBlock label="Category" value="Legal Awareness" />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Asset File</p>
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-md border border-dashed border-[#D8E3EE] bg-[#FAFCFF] text-[#94A3B8]">
            <CloudUpload className="mb-1 h-4 w-4" />
            <p className="text-xs">Click to upload or drag and drop</p>
            <p className="text-[10px]">PDF, MP4, or MP3 (max 50MB)</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SelectBlock label="Jurisdiction" value="Federal" />
          <label className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Expiry / Review Date</p>
            <div className="relative">
              <input
                type="text"
                readOnly
                value="mm/dd/yyyy"
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#94A3B8]"
              />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E4EAF1] pt-3">
          <button type="button" className="h-8 rounded-md px-3 text-xs font-semibold text-[#64748B]">Cancel</button>
          <button type="button" className="h-8 rounded-md bg-[#F59E0B] px-4 text-xs font-semibold text-white">Upload & Publish</button>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
