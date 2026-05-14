import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import {
  createMediaAsset,
  listAdminMediaAssets,
  updateMediaAsset,
  type MediaAssetItem,
} from "@/lib/media-assets";
import { ChevronDown, FileImage, ImageUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CATEGORY_OPTIONS = ["Cybersecurity", "Racism Reporting", "Online Abuse", "Emergency Help"] as const;
const CARD_TITLE_MAX_LENGTH = 120;
const SUBTITLE_MAX_LENGTH = 180;

function CardInput({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
        <span className="text-[10px] text-[#94A3B8]">
          {value.length}/{maxLength} chars
        </span>
      </div>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={event => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#1E293B] outline-none transition focus:border-[#0F67AE]"
      />
    </label>
  );
}

export function AdminContentMediaAssetPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAsset, setCurrentAsset] = useState<MediaAssetItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetName, setAssetName] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("Cybersecurity");
  const [cardTitle, setCardTitle] = useState("Recognizing Phishing Attempts");
  const [subtitle, setSubtitle] = useState("Learn the signs of a suspicious email.");
  const [bodyText, setBodyText] = useState("Phishing emails often create a sense of urgency. Look for generic greetings like 'Dear Customer,' misspelled words, or strange sender addresses. If an email asks for sensitive information immediately, verify it through another channel.");
  const [statusMessage, setStatusMessage] = useState<string | null>("Loading media asset controls...");
  const [isSaving, setIsSaving] = useState(false);
  const categoryOptions = CATEGORY_OPTIONS.includes(category as (typeof CATEGORY_OPTIONS)[number])
    ? CATEGORY_OPTIONS
    : [category, ...CATEGORY_OPTIONS];

  useEffect(() => {
    let isMounted = true;

    void listAdminMediaAssets().then((assets) => {
      if (!isMounted) {
        return;
      }

      const latestAsset = assets[0];

      if (latestAsset) {
        setCurrentAsset(latestAsset);
        setAssetName(latestAsset.originalFileName);
        setCategory(latestAsset.category);
        setCardTitle(latestAsset.title);
        setSubtitle(latestAsset.subtitle);
        setBodyText(latestAsset.bodyText);
        setStatusMessage("Media asset controls are active.");
        return;
      }

      setStatusMessage("No media assets found. Upload an image to create one.");
    }).catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setStatusMessage(error instanceof Error ? error.message : "Could not load media assets.");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetDraft = () => {
    setSelectedFile(null);
    setAssetName(currentAsset?.originalFileName ?? null);
    setCategory(currentAsset?.category ?? "Cybersecurity");
    setCardTitle(currentAsset?.title ?? "Recognizing Phishing Attempts");
    setSubtitle(currentAsset?.subtitle ?? "Learn the signs of a suspicious email.");
    setBodyText(currentAsset?.bodyText ?? "Phishing emails often create a sense of urgency. Look for generic greetings like 'Dear Customer,' misspelled words, or strange sender addresses. If an email asks for sensitive information immediately, verify it through another channel.");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setStatusMessage("Media draft reset.");
  };

  const saveAsset = async () => {
    if (!cardTitle.trim() || !subtitle.trim() || !bodyText.trim()) {
      setStatusMessage("Card title, subtitle, and body text are required.");
      return;
    }

    if (!currentAsset && !selectedFile) {
      setStatusMessage("Upload an image before saving a new media asset.");
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        title: cardTitle.trim(),
        subtitle: subtitle.trim(),
        bodyText: bodyText.trim(),
        category,
        status: "published" as const,
        file: selectedFile,
      };
      const savedAsset = currentAsset
        ? await updateMediaAsset(currentAsset.id, input)
        : await createMediaAsset(input);

      setCurrentAsset(savedAsset);
      setSelectedFile(null);
      setAssetName(savedAsset.originalFileName);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setStatusMessage(`Saved media card "${savedAsset.title}" in ${savedAsset.category}.`);
    }
    catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not save media asset.");
    }
    finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminContentManagementShell>
      <section className="w-full min-w-0 space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
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
              const file = event.target.files?.[0] ?? null;

              if (file && file.size > 2 * 1024 * 1024) {
                setSelectedFile(null);
                setAssetName(currentAsset?.originalFileName ?? null);
                event.target.value = "";
                setStatusMessage("Image must be 2MB or smaller.");
                return;
              }

              setSelectedFile(file);
              setAssetName(file?.name ?? currentAsset?.originalFileName ?? null);
              setStatusMessage(file ? `Selected asset ${file.name}.` : null);
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
          <label className="block space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Categorization</p>
            <span className="relative block">
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setStatusMessage(`Category changed to ${event.target.value}.`);
                }}
                className="h-9 w-full appearance-none rounded-md border border-[#D8E3EE] bg-white px-3 pr-9 text-sm text-[#334155] outline-none transition hover:bg-[#F8FBFF] focus:border-[#0F67AE]"
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            </span>
          </label>
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
            <CardInput
              label="Card Title"
              value={cardTitle}
              maxLength={CARD_TITLE_MAX_LENGTH}
              onChange={setCardTitle}
            />
            <CardInput
              label="Subtitle"
              value={subtitle}
              maxLength={SUBTITLE_MAX_LENGTH}
              onChange={setSubtitle}
            />
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
            onClick={resetDraft}
            disabled={isSaving}
            className="h-8 rounded-md px-3 text-xs font-semibold text-[#64748B] transition hover:bg-[#F3F7FB]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void saveAsset()}
            disabled={isSaving}
            className="h-8 rounded-md bg-[#0F67AE] px-4 text-xs font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Asset"}
          </button>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
