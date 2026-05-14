import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import {
  createContentResource,
  getAdminContentResource,
  updateContentResource,
} from "@/lib/content-resources";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import { CalendarDays, ChevronDown, CloudUpload, ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const LANGUAGE_OPTIONS = ["English", "Arabic", "Mandarin", "Vietnamese"] as const;
const CATEGORY_OPTIONS = ["Legal Awareness", "Online Abuse", "Family Safety", "Youth Support"] as const;
const JURISDICTION_OPTIONS = ["Federal", "NSW", "VIC", "QLD"] as const;

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
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-9 w-full appearance-none rounded-md border border-[#D8E3EE] bg-white px-3 pr-9 text-sm text-[#334155] outline-none transition hover:bg-[#F8FBFF] focus:border-[#0F67AE]"
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
      </div>
    </label>
  );
}

function formatReviewDateForInput(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function getResourceNameFromFileName(fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const normalizedName = nameWithoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedName || fileName;
}

export function AdminContentUploadResourcePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resourceId = searchParams.get("resourceId");
  const isBulkMode = searchParams.get("mode") === "bulk" && !resourceId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [resourceName, setResourceName] = useState(isBulkMode ? "" : "Legal Support Framework 2024");
  const [language, setLanguage] = useState<string>("English");
  const [category, setCategory] = useState<string>("Legal Awareness");
  const [jurisdiction, setJurisdiction] = useState<string>("Federal");
  const [reviewDate, setReviewDate] = useState("06/30/2026");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [existingImageFileName, setExistingImageFileName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(resourceId);
  const selectedFileName = selectedFiles[0]?.name ?? existingFileName;
  const selectedImageFileName = selectedImageFile?.name ?? existingImageFileName;

  useEffect(() => {
    if (!resourceId) {
      return;
    }

    let isMounted = true;

    const loadResource = async () => {
      try {
        const resource = await getAdminContentResource(resourceId);

        if (!isMounted) {
          return;
        }

        setResourceName(resource.name);
        setLanguage(resource.language);
        setCategory(resource.category);
        setJurisdiction(resource.jurisdiction);
        setReviewDate(formatReviewDateForInput(resource.reviewDate));
        setExistingFileName(resource.originalFileName);
        setExistingImageFileName(resource.imageOriginalFileName ?? null);
        setStatusMessage(`Editing ${resource.name}.`);
      }
      catch (error) {
        if (isMounted) {
          setStatusMessage(error instanceof Error ? error.message : "Could not load resource.");
        }
      }
    };

    void loadResource();

    return () => {
      isMounted = false;
    };
  }, [resourceId]);

  const handleSelectedFiles = (files?: FileList | File[]) => {
    const nextFiles = Array.from(files ?? []);
    const normalizedFiles = isBulkMode ? nextFiles : nextFiles.slice(0, 1);

    setSelectedFiles(normalizedFiles);

    if (normalizedFiles.length === 0) {
      setStatusMessage(null);
      return;
    }

    setStatusMessage(
      isBulkMode
        ? `Ready to publish ${normalizedFiles.length} resources.`
        : `Ready to publish ${normalizedFiles[0].name}`,
    );
  };

  const handleSelectedImageFile = (file?: File) => {
    setSelectedImageFile(file ?? null);
    setStatusMessage(file ? `Ready to attach cover image ${file.name}` : null);
  };

  const handleSubmit = async () => {
    const trimmedName = resourceName.trim();

    if (!trimmedName && !isBulkMode) {
      setStatusMessage("Resource name is required.");
      return;
    }

    if (selectedFiles.length === 0 && !isEditing) {
      setStatusMessage(
        isBulkMode
          ? "Please choose one or more PDF, MP3, or MP4 files before publishing."
          : "Please choose a PDF, MP3, or MP4 file before publishing.",
      );
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(isBulkMode ? `Uploading ${selectedFiles.length} resources...` : isEditing ? "Updating resource..." : "Uploading resource...");

    try {
      const basePayload = {
        name: trimmedName,
        language,
        category,
        jurisdiction,
        reviewDate: reviewDate.trim() || undefined,
        status: "published" as const,
        imageFile: selectedImageFile,
      };

      if (isBulkMode) {
        for (const [index, file] of selectedFiles.entries()) {
          await createContentResource({
            ...basePayload,
            name: trimmedName
              ? `${trimmedName} ${index + 1}`
              : getResourceNameFromFileName(file.name),
            file,
          });
        }

        navigate(APP_ROUTE_PATHS.adminContentResourceLibrary, {
          state: {
            statusMessage: `Published ${selectedFiles.length} resources.`,
          },
        });
        return;
      }

      const resource = resourceId
        ? await updateContentResource(resourceId, {
            ...basePayload,
            file: selectedFiles[0] ?? null,
          })
        : await createContentResource({
            ...basePayload,
            file: selectedFiles[0],
          });

      navigate(APP_ROUTE_PATHS.adminContentResourceLibrary, {
        state: {
          statusMessage: `${isEditing ? "Updated" : "Published"} ${resource.name}.`,
        },
      });
    }
    catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Resource upload failed.");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminContentManagementShell>
      <section className="w-full min-w-0 space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1E293B]">
            {isBulkMode ? "Bulk Upload Resources" : "Upload New Resource"}
          </h3>
          <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
            {isBulkMode ? "Add multiple files to production library" : "Add to production library"}
          </p>
          {statusMessage
            ? <p className="mt-2 text-[12px] font-medium text-[#0F67AE]">{statusMessage}</p>
            : null}
        </div>

        <InputBlock
          label={isBulkMode ? "Resource Name Prefix (Optional)" : "Resource Name"}
          value={resourceName}
          onChange={setResourceName}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <SelectBlock
            label="Primary Language"
            value={language}
            options={LANGUAGE_OPTIONS}
            onChange={setLanguage}
          />
          <SelectBlock
            label="Category"
            value={category}
            options={CATEGORY_OPTIONS}
            onChange={setCategory}
          />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Asset File</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.mp3,.mp4"
            multiple={isBulkMode}
            className="hidden"
            onChange={(event) => {
              handleSelectedFiles(event.target.files ?? undefined);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleSelectedFiles(event.dataTransfer.files);
            }}
            className="flex min-h-[120px] w-full flex-col items-center justify-center rounded-md border border-dashed border-[#C9D8E8] bg-[#FAFCFF] px-4 text-center text-[#7F91A8] transition hover:border-[#0F67AE] hover:bg-[#F4F9FF]"
          >
            <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF6FF] text-[#0F67AE]">
              <CloudUpload className="h-4 w-4" />
            </span>
            <p className="text-xs font-semibold text-[#475569]">
              {isBulkMode ? "Click to upload multiple files or drag and drop" : "Click to upload or drag and drop"}
            </p>
            <p className="mt-1 text-[10px]">PDF, MP4, or MP3 (max 50MB each)</p>
            {selectedFiles.length > 0
              ? (
                  <div className="mt-3 flex max-w-full flex-wrap justify-center gap-1.5">
                    {selectedFiles.slice(0, 4).map(file => (
                      <span key={`${file.name}-${file.size}`} className="max-w-[220px] truncate rounded bg-[#EEF6FF] px-3 py-1 text-[11px] font-semibold text-[#0F67AE]">
                        {file.name}
                      </span>
                    ))}
                    {selectedFiles.length > 4
                      ? <span className="rounded bg-[#EEF6FF] px-3 py-1 text-[11px] font-semibold text-[#0F67AE]">+{selectedFiles.length - 4} more</span>
                      : null}
                  </div>
                )
              : selectedFileName
                ? <p className="mt-3 rounded bg-[#EEF6FF] px-3 py-1 text-[11px] font-semibold text-[#0F67AE]">{selectedFileName}</p>
                : null}
            {isBulkMode && selectedFiles.length > 0
              ? <p className="mt-2 text-[10px] font-medium text-[#607B90]">Each file will be published as a separate resource.</p>
              : null}
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Cover Image</p>
          <input
            ref={imageInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={(event) => {
              handleSelectedImageFile(event.target.files?.[0]);
            }}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleSelectedImageFile(event.dataTransfer.files?.[0]);
            }}
            className="flex min-h-[96px] w-full flex-col items-center justify-center rounded-md border border-dashed border-[#D8E3EE] bg-[#FAFCFF] text-[#94A3B8] transition hover:border-[#0F67AE] hover:bg-[#F4F9FF]"
          >
            <ImagePlus className="mb-1 h-4 w-4" />
            <p className="text-xs">Optional thumbnail image</p>
            <p className="text-[10px]">JPG, PNG, WebP, or GIF (max 10MB)</p>
            {selectedImageFileName
              ? <p className="mt-3 rounded bg-[#EEF6FF] px-3 py-1 text-[11px] font-semibold text-[#0F67AE]">{selectedImageFileName}</p>
              : null}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SelectBlock
            label="Jurisdiction"
            value={jurisdiction}
            options={JURISDICTION_OPTIONS}
            onChange={setJurisdiction}
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
              navigate(APP_ROUTE_PATHS.adminContentResourceLibrary);
            }}
            className="h-8 rounded-md px-3 text-xs font-semibold text-[#64748B] transition hover:bg-[#F3F7FB]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            className="h-8 rounded-md bg-[#F59E0B] px-4 text-xs font-semibold text-white transition hover:bg-[#D88B07]"
          >
            {isSubmitting ? "Publishing..." : isBulkMode ? "Upload All & Publish" : "Upload & Publish"}
          </button>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
