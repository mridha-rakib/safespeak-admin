import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import { CalendarDays, ChevronDown, CloudUpload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const LANGUAGE_OPTIONS = ["English", "Arabic", "Mandarin", "Vietnamese"] as const;
const CATEGORY_OPTIONS = ["Legal Awareness", "Online Abuse", "Family Safety", "Youth Support"] as const;
const JURISDICTION_OPTIONS = ["Federal", "NSW", "VIC", "QLD"] as const;

function nextOption<T extends readonly string[]>(options: T, currentValue: string) {
  const currentIndex = options.findIndex(option => option === currentValue);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % options.length;
  return options[nextIndex];
}

function InputBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
      <input
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
      />
    </label>
  );
}

function SelectBlock({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <label className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
      <button
        type="button"
        onClick={onClick}
        className="flex h-9 w-full items-center justify-between rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] transition hover:bg-[#F8FBFF]"
      >
        {value}
        <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
      </button>
    </label>
  );
}

export function AdminContentUploadResourcePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceName, setResourceName] = useState("Legal Support Framework 2024");
  const [language, setLanguage] = useState<string>("English");
  const [category, setCategory] = useState<string>("Legal Awareness");
  const [jurisdiction, setJurisdiction] = useState<string>("Federal");
  const [reviewDate, setReviewDate] = useState("06/30/2026");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  return (
    <AdminContentManagementShell>
      <section className="w-full min-w-0 space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1E293B]">Upload New Resource</h3>
          <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Add to production library</p>
          {statusMessage
            ? <p className="mt-2 text-[12px] font-medium text-[#0F67AE]">{statusMessage}</p>
            : null}
        </div>

        <InputBlock label="Resource Name" value={resourceName} onChange={setResourceName} />

        <div className="grid gap-3 md:grid-cols-2">
          <SelectBlock
            label="Primary Language"
            value={language}
            onClick={() => setLanguage(nextOption(LANGUAGE_OPTIONS, language))}
          />
          <SelectBlock
            label="Category"
            value={category}
            onClick={() => setCategory(nextOption(CATEGORY_OPTIONS, category))}
          />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Asset File</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.mp3,.mp4"
            className="hidden"
            onChange={(event) => {
              const fileName = event.target.files?.[0]?.name;
              setSelectedFile(fileName ?? null);
              setStatusMessage(fileName ? `Ready to publish ${fileName}` : null);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[120px] w-full flex-col items-center justify-center rounded-md border border-dashed border-[#D8E3EE] bg-[#FAFCFF] text-[#94A3B8] transition hover:border-[#0F67AE] hover:bg-[#F4F9FF]"
          >
            <CloudUpload className="mb-1 h-4 w-4" />
            <p className="text-xs">Click to upload or drag and drop</p>
            <p className="text-[10px]">PDF, MP4, or MP3 (max 50MB)</p>
            {selectedFile
              ? <p className="mt-3 rounded bg-[#EEF6FF] px-3 py-1 text-[11px] font-semibold text-[#0F67AE]">{selectedFile}</p>
              : null}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SelectBlock
            label="Jurisdiction"
            value={jurisdiction}
            onClick={() => setJurisdiction(nextOption(JURISDICTION_OPTIONS, jurisdiction))}
          />
          <label className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Expiry / Review Date</p>
            <div className="relative">
              <input
                type="text"
                value={reviewDate}
                onChange={event => setReviewDate(event.target.value)}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
              />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E4EAF1] pt-3">
          <button
            type="button"
            onClick={() => {
              setResourceName("");
              setLanguage(LANGUAGE_OPTIONS[0]);
              setCategory(CATEGORY_OPTIONS[0]);
              setJurisdiction(JURISDICTION_OPTIONS[0]);
              setReviewDate("");
              setSelectedFile(null);
              setStatusMessage("Draft cleared.");
            }}
            className="h-8 rounded-md px-3 text-xs font-semibold text-[#64748B] transition hover:bg-[#F3F7FB]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusMessage(`Published ${resourceName || "resource"} for ${jurisdiction}.`);
              navigate(APP_ROUTE_PATHS.adminContentResourceLibrary);
            }}
            className="h-8 rounded-md bg-[#F59E0B] px-4 text-xs font-semibold text-white transition hover:bg-[#D88B07]"
          >
            Upload & Publish
          </button>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
