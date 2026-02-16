import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { ChevronDown, FileImage, ImageUp } from "lucide-react";

function CardInput({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <label className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
        {helper ? <span className="text-[10px] text-[#94A3B8]">{helper}</span> : null}
      </div>
      <input
        type="text"
        readOnly
        value={value}
        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#1E293B]"
      />
    </label>
  );
}

export function AdminContentMediaAssetPage() {
  return (
    <AdminContentManagementShell>
      <section className="space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1E293B]">
            <FileImage className="h-4 w-4 text-[#0F67AE]" />
            Media Asset
          </p>
          <div className="space-y-2">
            <div className="flex min-h-[125px] flex-col items-center justify-center rounded-md border border-dashed border-[#D8E3EE] bg-[#FAFCFF] text-[#94A3B8]">
              <ImageUp className="mb-1 h-4 w-4" />
              <p className="text-xs">Upload Image</p>
            </div>
            <div className="flex justify-between text-[10px] text-[#94A3B8]">
              <span>Format: JPG, PNG</span>
              <span>Max 2MB</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Categorization</p>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155]"
          >
            Cybersecurity
            <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1E293B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0F67AE]" />
              Card Content
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">General Info</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CardInput label="Card Title" value="Recognizing Phishing Attempts" helper="28/60 chars" />
            <CardInput label="Subtitle" value="Learn the signs of a suspicious email." helper="34/100 chars" />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Body Text</p>
            <div className="rounded-md border border-[#D8E3EE]">
              <div className="flex items-center gap-3 border-b border-[#E6EDF4] px-3 py-1.5 text-xs text-[#607B90]">
                <span className="font-semibold">B</span>
                <span className="italic">I</span>
                <span>link</span>
                <span>list</span>
              </div>
              <textarea
                rows={6}
                readOnly
                value="Phishing emails often create a sense of urgency. Look for generic greetings like 'Dear Customer,' misspelled words, or strange sender addresses. If an email asks for sensitive information immediately, verify it through another channel."
                className="w-full resize-none rounded-b-md bg-white px-3 py-2 text-sm leading-6 text-[#334155]"
              />
            </div>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
