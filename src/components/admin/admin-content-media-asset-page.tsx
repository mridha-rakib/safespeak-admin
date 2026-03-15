import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { ChevronDown, FileImage, ImageUp } from "lucide-react";
import { useRef, useState } from "react";

const CATEGORY_OPTIONS = ["Cybersecurity", "Racism Reporting", "Online Abuse", "Emergency Help"] as const;

function nextOption<T extends readonly string[]>(options: T, currentValue: string) {
  const currentIndex = options.findIndex(option => option === currentValue);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % options.length;
  return options[nextIndex];
}

function CardInput({
  label,
  value,
  helper,
  onChange,
}: {
  label: string;
  value: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
        {helper ? <span className="text-[10px] text-[#94A3B8]">{helper}</span> : null}
      </div>
      <input
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#1E293B] outline-none transition focus:border-[#0F67AE]"
      />
    </label>
  );
}

export function AdminContentMediaAssetPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assetName, setAssetName] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("Cybersecurity");
  const [cardTitle, setCardTitle] = useState("Recognizing Phishing Attempts");
  const [subtitle, setSubtitle] = useState("Learn the signs of a suspicious email.");
  const [bodyText, setBodyText] = useState("Phishing emails often create a sense of urgency. Look for generic greetings like 'Dear Customer,' misspelled words, or strange sender addresses. If an email asks for sensitive information immediately, verify it through another channel.");
  const [statusMessage, setStatusMessage] = useState<string | null>("Media asset controls are active.");

  return (
    <AdminContentManagementShell>
      <section className="space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1E293B]">
              <FileImage className="h-4 w-4 text-[#0F67AE]" />
              Media Asset
            </p>
            {statusMessage
              ? <p className="text-[12px] font-medium text-[#0F67AE]">{statusMessage}</p>
              : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(event) => {
              const fileName = event.target.files?.[0]?.name;
              setAssetName(fileName ?? null);
              setStatusMessage(fileName ? `Selected asset ${fileName}.` : null);
            }}
          />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[125px] w-full flex-col items-center justify-center rounded-md border border-dashed border-[#D8E3EE] bg-[#FAFCFF] text-[#94A3B8] transition hover:border-[#0F67AE] hover:bg-[#F4F9FF]"
            >
              <ImageUp className="mb-1 h-4 w-4" />
              <p className="text-xs">{assetName ? "Replace Image" : "Upload Image"}</p>
              {assetName
                ? <p className="mt-2 rounded bg-[#EEF6FF] px-3 py-1 text-[11px] font-semibold text-[#0F67AE]">{assetName}</p>
                : null}
            </button>
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
            onClick={() => {
              const nextCategory = nextOption(CATEGORY_OPTIONS, category);
              setCategory(nextCategory);
              setStatusMessage(`Category changed to ${nextCategory}.`);
            }}
            className="flex h-9 w-full items-center justify-between rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] transition hover:bg-[#F8FBFF]"
          >
            {category}
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
            <CardInput label="Card Title" value={cardTitle} helper="28/60 chars" onChange={setCardTitle} />
            <CardInput label="Subtitle" value={subtitle} helper="34/100 chars" onChange={setSubtitle} />
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
                value={bodyText}
                onChange={event => setBodyText(event.target.value)}
                className="w-full resize-none rounded-b-md bg-white px-3 py-2 text-sm leading-6 text-[#334155] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#E4EAF1] pt-3">
          <button
            type="button"
            onClick={() => {
              setAssetName(null);
              setStatusMessage("Media draft reset.");
            }}
            className="h-8 rounded-md px-3 text-xs font-semibold text-[#64748B] transition hover:bg-[#F3F7FB]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setStatusMessage(`Saved media card "${cardTitle}" in ${category}.`)}
            className="h-8 rounded-md bg-[#0F67AE] px-4 text-xs font-semibold text-white transition hover:bg-[#0B578F]"
          >
            Save Asset
          </button>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
