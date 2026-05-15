import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import {
  createMediaAsset,
  getMediaAssetImageUrl,
  listAdminMediaAssets,
  updateMediaAsset,
  type MediaAssetFormInput,
  type MediaAssetItem,
  type MediaAssetStatus,
} from "@/lib/media-assets";
import {
  Bold,
  CalendarDays,
  ChevronDown,
  FileImage,
  ImageUp,
  Italic,
  Link2,
  List,
  ListOrdered,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const CATEGORY_OPTIONS = [
  "Cybersecurity",
  "Racism Reporting",
  "Online Abuse",
  "Emergency Help",
  "Legal Awareness",
] as const;
const STATUS_OPTIONS: Array<{ label: string; value: MediaAssetStatus }> = [
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
];
const PRIMARY_CTA_OPTIONS = [
  "Start learning",
  "Open resource",
  "Download checklist",
  "Report safely",
  "Contact support",
] as const;
const SECONDARY_BUTTON_OPTIONS = [
  "None",
  "Preview card",
  "View details",
  "Open support directory",
  "Save draft",
] as const;
const CARD_TITLE_MAX_LENGTH = 120;
const SUBTITLE_MAX_LENGTH = 180;
const BODY_MAX_LENGTH = 5000;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

type FieldProps = {
  label: string;
  children: ReactNode;
  helper?: ReactNode;
};

function Field({ label, children, helper }: FieldProps) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <div className="flex min-h-4 items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
          {label}
        </span>
        {helper ? (
          <span className="shrink-0 text-[11px] font-medium text-[#94A3B8]">
            {helper}
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function TextInput({
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
    <Field label={label} helper={`${value.length}/${maxLength} chars`}>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={event => onChange(event.target.value)}
        className="h-[46px] w-full rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 text-sm font-medium text-[#0F172A] shadow-sm outline-none transition focus:border-[#01599D] focus:ring-2 focus:ring-[#B8D9F2]"
      />
    </Field>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const normalizedOptions = options.includes(value)
    ? options
    : ([value, ...options] as readonly string[]);

  return (
    <Field label={label}>
      <span className="relative block">
        <select
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-[46px] w-full appearance-none rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 pr-11 text-sm text-[#0F172A] shadow-sm outline-none transition hover:bg-white focus:border-[#01599D] focus:ring-2 focus:ring-[#B8D9F2]"
        >
          {normalizedOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
      </span>
    </Field>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <span className="relative block">
        <input
          type="date"
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-[42px] w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 pr-11 text-sm text-[#334155] outline-none transition focus:border-[#01599D] focus:ring-2 focus:ring-[#B8D9F2]"
        />
        <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
      </span>
    </Field>
  );
}

function formatDateForInput(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDefaultCreatedDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AdminContentMediaAssetPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyTextRef = useRef<HTMLTextAreaElement>(null);
  const [currentAsset, setCurrentAsset] = useState<MediaAssetItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assetName, setAssetName] = useState<string | null>(null);
  const [assetSizeLabel, setAssetSizeLabel] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("Cybersecurity");
  const [status, setStatus] = useState<MediaAssetStatus>("published");
  const [cardTitle, setCardTitle] = useState("Recognizing Phishing Attempts");
  const [subtitle, setSubtitle] = useState("Learn the signs of a suspicious email.");
  const [bodyText, setBodyText] = useState(
    "Phishing emails often create a sense of urgency. Look for generic greetings like 'Dear Customer,' misspelled words, or strange sender addresses. If an email asks for sensitive information immediately, verify it through another channel."
  );
  const [createdDate, setCreatedDate] = useState(getDefaultCreatedDate);
  const [expirationDate, setExpirationDate] = useState("");
  const [offlineCachingEnabled, setOfflineCachingEnabled] = useState(false);
  const [primaryCta, setPrimaryCta] = useState("Start learning");
  const [secondaryButton, setSecondaryButton] = useState("None");
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "Loading media asset controls..."
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imagePreview = useMemo(() => {
    if (previewUrl) {
      return previewUrl;
    }

    return currentAsset ? getMediaAssetImageUrl(currentAsset) : null;
  }, [currentAsset, previewUrl]);

  const applyAsset = (asset: MediaAssetItem) => {
    setCurrentAsset(asset);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAssetName(asset.originalFileName);
    setAssetSizeLabel(formatBytes(asset.fileSizeBytes));
    setCategory(asset.category);
    setStatus(asset.status);
    setCardTitle(asset.title);
    setSubtitle(asset.subtitle);
    setBodyText(asset.bodyText);
    setCreatedDate(formatDateForInput(asset.createdDate) || getDefaultCreatedDate());
    setExpirationDate(formatDateForInput(asset.expirationDate));
    setOfflineCachingEnabled(asset.offlineCachingEnabled);
    setPrimaryCta(asset.primaryCta ?? "Start learning");
    setSecondaryButton(asset.secondaryButton ?? "None");
  };

  useEffect(() => {
    let isMounted = true;

    void listAdminMediaAssets()
      .then((assets) => {
        if (!isMounted) {
          return;
        }

        const latestAsset = assets[0];

        if (latestAsset) {
          applyAsset(latestAsset);
          setStatusMessage(`Editing latest asset: ${latestAsset.title}.`);
          return;
        }

        setStatusMessage("No media assets found. Upload an image to create one.");
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load media assets."
          );
          setStatusMessage(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

  const handleSelectedFile = (file?: File) => {
    setErrorMessage(null);

    if (!file) {
      setSelectedFile(null);
      setAssetName(currentAsset?.originalFileName ?? null);
      setAssetSizeLabel(currentAsset ? formatBytes(currentAsset.fileSizeBytes) : null);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setSelectedFile(null);
      setAssetName(currentAsset?.originalFileName ?? null);
      setAssetSizeLabel(currentAsset ? formatBytes(currentAsset.fileSizeBytes) : null);
      setErrorMessage("Upload a JPG or PNG image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setSelectedFile(null);
      setAssetName(currentAsset?.originalFileName ?? null);
      setAssetSizeLabel(currentAsset ? formatBytes(currentAsset.fileSizeBytes) : null);
      setErrorMessage("Image must be 2MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setAssetName(file.name);
    setAssetSizeLabel(formatBytes(file.size));
    setStatusMessage(`Ready to upload ${file.name}.`);
  };

  const resetDraftToBlank = () => {
    setCurrentAsset(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAssetName(null);
    setAssetSizeLabel(null);
    setCategory("Cybersecurity");
    setStatus("published");
    setCardTitle("");
    setSubtitle("");
    setBodyText("");
    setCreatedDate("");
    setExpirationDate("");
    setOfflineCachingEnabled(false);
    setPrimaryCta("Start learning");
    setSecondaryButton("None");
  };

  const resetDraft = () => {
    setErrorMessage(null);
    resetDraftToBlank();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setStatusMessage("Draft cleared. Upload an image and enter card content to save a new asset.");
  };

  const applyBodyCommand = (command: "bold" | "italic" | "bullet" | "numbered" | "link") => {
    const textarea = bodyTextRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = bodyText.slice(start, end);
    const fallbackText = selectedText || "text";
    const replacementMap = {
      bold: `**${fallbackText}**`,
      italic: `_${fallbackText}_`,
      bullet: `- ${fallbackText}`,
      numbered: `1. ${fallbackText}`,
      link: `[${fallbackText}](https://)`,
    };
    const replacement = replacementMap[command];
    const nextValue = `${bodyText.slice(0, start)}${replacement}${bodyText.slice(end)}`;

    setBodyText(nextValue.slice(0, BODY_MAX_LENGTH));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  };

  const saveAsset = async () => {
    setErrorMessage(null);

    if (!cardTitle.trim() || !subtitle.trim() || !bodyText.trim()) {
      setErrorMessage("Card title, subtitle, and body text are required.");
      return;
    }

    if (!currentAsset && !selectedFile) {
      setErrorMessage("Upload an image before saving a new media asset.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("Saving media asset...");

    try {
      const input: MediaAssetFormInput = {
        title: cardTitle.trim(),
        subtitle: subtitle.trim(),
        bodyText: bodyText.trim(),
        category,
        status,
        createdDate: createdDate || undefined,
        expirationDate: expirationDate || undefined,
        offlineCachingEnabled,
        primaryCta: primaryCta === "None" ? undefined : primaryCta,
        secondaryButton: secondaryButton === "None" ? undefined : secondaryButton,
        file: selectedFile,
      };
      const savedAsset = currentAsset
        ? await updateMediaAsset(currentAsset.id, input)
        : await createMediaAsset(input);

      applyAsset(savedAsset);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setStatusMessage(`Saved media asset "${savedAsset.title}".`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save media asset.");
      setStatusMessage(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminContentManagementShell>
      <section className="w-full min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4 py-4">
          <div>
            <h3 className="inline-flex items-center gap-2 text-lg font-semibold text-[#0F172A]">
              <FileImage className="h-5 w-5 text-[#01599D]" />
              Media Asset
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#64748B]">
              Upload the image and manage the card details shown in the user experience.
            </p>
          </div>
          <p className="max-w-[420px] text-right text-xs font-semibold text-[#01599D]">
            {isLoading ? "Loading..." : statusMessage}
          </p>
        </div>

        {errorMessage ? (
          <div className="pb-4">
            <p className="rounded-lg border border-[#F8C9C9] bg-[#FFF5F5] px-3 py-2 text-sm font-medium text-[#B42318]">
              {errorMessage}
            </p>
          </div>
        ) : null}

        <div className="border-t border-[#E5ECF3] py-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              handleSelectedFile(event.target.files?.[0]);
            }}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={event => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleSelectedFile(event.dataTransfer.files?.[0]);
                }}
                className="flex min-h-[220px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#CFE0F2] bg-[#F7F9FB] px-6 text-center transition hover:border-[#01599D] hover:bg-[#F4F9FF]"
              >
                {imagePreview ? (
                  <span
                    aria-hidden="true"
                    style={{ backgroundImage: `url(${imagePreview})` }}
                    className="mb-4 h-28 w-44 rounded-lg border border-[#D8E3EE] bg-cover bg-center shadow-sm"
                  />
                ) : (
                  <ImageUp className="mb-2 h-6 w-6 text-[#94A3B8]" />
                )}
                <span className="text-sm font-semibold text-[#475569]">
                  {assetName ? "Replace Image" : "Upload Image"}
                </span>
                {assetName ? (
                  <span className="mt-2 max-w-full truncate rounded-md bg-[#EEF6FF] px-3 py-1 text-xs font-semibold text-[#01599D]">
                    {assetName}
                  </span>
                ) : null}
              </button>
              <div className="mt-3 flex items-center justify-between text-xs text-[#64748B]">
                <span>Format: JPG, PNG</span>
                <span>{assetSizeLabel ? `Selected: ${assetSizeLabel}` : "Max 2MB"}</span>
              </div>
            </div>

            <div className="grid content-start gap-4 sm:grid-cols-2">
              <SelectField
                label="Category"
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={(value) => {
                  setCategory(value);
                  setStatusMessage(`Category changed to ${value}.`);
                }}
              />
              <SelectField
                label="Status"
                value={status}
                options={STATUS_OPTIONS.map(option => option.value)}
                onChange={(value) => setStatus(value as MediaAssetStatus)}
              />
              <DateField
                label="Created Date"
                value={createdDate}
                onChange={setCreatedDate}
              />
              <DateField
                label="Expiration Date"
                value={expirationDate}
                onChange={setExpirationDate}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5ECF3] py-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-[#0F172A]">
              <span className="h-2 w-2 rounded-full bg-[#01599D]" />
              Card Content
            </h3>
            <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              General Info
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Card Title"
              value={cardTitle}
              maxLength={CARD_TITLE_MAX_LENGTH}
              onChange={setCardTitle}
            />
            <TextInput
              label="Subtitle"
              value={subtitle}
              maxLength={SUBTITLE_MAX_LENGTH}
              onChange={setSubtitle}
            />
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex min-h-4 items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#64748B]">
                Body Text
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8]">
                {bodyText.length}/{BODY_MAX_LENGTH} chars
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] shadow-sm">
              <div className="flex min-h-[48px] items-center gap-1 border-b border-[#CBD5E1] bg-[#F1F5F9] px-2 py-2">
                {[
                  { label: "Bold", icon: <Bold className="h-4 w-4" />, command: "bold" as const },
                  { label: "Italic", icon: <Italic className="h-4 w-4" />, command: "italic" as const },
                  { label: "Bulleted list", icon: <List className="h-4 w-4" />, command: "bullet" as const },
                  { label: "Numbered list", icon: <ListOrdered className="h-4 w-4" />, command: "numbered" as const },
                  { label: "Link", icon: <Link2 className="h-4 w-4" />, command: "link" as const },
                ].map(item => (
                  <button
                    key={item.command}
                    type="button"
                    title={item.label}
                    onClick={() => applyBodyCommand(item.command)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-[#475569] transition hover:bg-white hover:text-[#01599D]"
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
              <textarea
                ref={bodyTextRef}
                rows={7}
                value={bodyText}
                maxLength={BODY_MAX_LENGTH}
                onChange={event => setBodyText(event.target.value)}
                className="min-h-[170px] w-full resize-y bg-[#F8FAFC] px-4 py-3 text-sm leading-6 text-[#0F172A] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5ECF3] py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h4 className="text-sm font-semibold text-[#334155]">
                  Enable Offline Caching
                </h4>
                <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                  Allow learners to access this lesson without an internet connection.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={offlineCachingEnabled}
                onClick={() => setOfflineCachingEnabled(value => !value)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  offlineCachingEnabled ? "bg-[#01599D]" : "bg-[#E2E8F0]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full border border-[#D1D5DB] bg-white transition ${
                    offlineCachingEnabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Primary Call-to-Action"
                value={primaryCta}
                options={PRIMARY_CTA_OPTIONS}
                onChange={setPrimaryCta}
              />
              <SelectField
                label="Secondary Button"
                value={secondaryButton}
                options={SECONDARY_BUTTON_OPTIONS}
                onChange={setSecondaryButton}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E4EAF1] py-4">
            <button
              type="button"
              onClick={resetDraft}
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#334155] transition hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => void saveAsset()}
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#01599D] px-4 text-sm font-semibold text-white transition hover:bg-[#014A82] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Asset"}
            </button>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
