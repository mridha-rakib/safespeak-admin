import { Building2, Info, MapPin, MoreVertical, Phone, Plus, Search, Upload } from "lucide-react";
import { useRef, useState } from "react";

type MicroCard = {
  title: string;
  description: string;
  tag: "Published" | "Draft";
  views: number;
  updated: string;
};

const INITIAL_MICRO_CARDS: MicroCard[] = [
  {
    title: "Spotting Phishing Scams",
    description: "Learn to identify suspicious emails and links to protect your personal data.",
    tag: "Published" as const,
    views: 1200,
    updated: "Updated 2h ago",
  },
  {
    title: "Emergency Contacts",
    description: "Quick access list for local emergency services and helplines.",
    tag: "Draft" as const,
    views: 0,
    updated: "Updated 1d ago",
  },
  {
    title: "Secure Banking Tips",
    description: "Best practices for managing your finances safely.",
    tag: "Published" as const,
    views: 856,
    updated: "Updated 3d ago",
  },
];

const resources = [
  {
    name: "First National Bank Support",
    category: "Banks",
    region: "North America",
    contact: "1-800-555-0199",
  },
  {
    name: "Community Legal Services",
    category: "Legal Aid",
    region: "New York, NY",
    contact: "contact@cls.org",
  },
  {
    name: "SafeHarbor Counseling",
    category: "Counseling",
    region: "Remote / Online",
    contact: "Chat Available",
  },
  {
    name: "Victim Support Hotline",
    category: "Counseling",
    region: "Nationwide",
    contact: "1-800-123-HELP",
  },
];

const categoryBadgeClassMap: Record<string, string> = {
  "Banks": "bg-[#DCEBFF] text-[#1D5FBF]",
  "Legal Aid": "bg-[#EFE2FF] text-[#7C3AED]",
  "Counseling": "bg-[#DDF7EC] text-[#0F766E]",
};

export function AdminContentManagementDashboard() {
  const [microCards, setMicroCards] = useState<MicroCard[]>(INITIAL_MICRO_CARDS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxUploadSize = 5 * 1024 * 1024;

  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === "\"" && inQuotes && nextChar === "\"") {
        currentValue += "\"";
        i += 1;
        continue;
      }

      if (char === "\"") {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
        continue;
      }

      currentValue += char;
    }

    values.push(currentValue.trim());
    return values;
  };

  const isValidCsvFile = (file: File) => {
    const hasCsvMimeType = file.type === "text/csv" || file.type === "application/vnd.ms-excel";
    const hasCsvExtension = file.name.toLowerCase().endsWith(".csv");

    if (!hasCsvMimeType && !hasCsvExtension) {
      return "Only .csv files are allowed.";
    }

    if (file.size > maxUploadSize) {
      return "File is too large. Maximum size is 5MB.";
    }

    return null;
  };

  const onFileSelected = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const validationError = isValidCsvFile(file);

    if (validationError) {
      setUploadError(validationError);
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
    setIsDraggingFile(false);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadedFile(null);
    setIsDraggingFile(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const importCsvFile = async () => {
    if (!uploadedFile) {
      return;
    }

    try {
      const csvText = await uploadedFile.text();
      const lines = csvText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        setUploadError("CSV must include a header row and at least one data row.");
        return;
      }

      const headers = parseCsvLine(lines[0]).map(header => header.toLowerCase());
      const titleIndex = headers.indexOf("title");
      const descriptionIndex = headers.indexOf("description");
      const tagIndex = headers.findIndex(header => header === "tag" || header === "status");
      const viewsIndex = headers.indexOf("views");

      if (titleIndex === -1 || descriptionIndex === -1) {
        setUploadError("CSV headers must include at least: title, description.");
        return;
      }

      const importedCards: MicroCard[] = lines
        .slice(1)
        .map((line) => {
          const row = parseCsvLine(line);
          const title = row[titleIndex]?.trim();
          const description = row[descriptionIndex]?.trim();
          const tagRaw = tagIndex >= 0 ? row[tagIndex]?.trim().toLowerCase() : "";
          const viewsRaw = viewsIndex >= 0 ? row[viewsIndex] : "";

          if (!title || !description) {
            return null;
          }

          return {
            title,
            description,
            tag: tagRaw === "published" ? "Published" : "Draft",
            views: Number.parseInt(viewsRaw ?? "", 10) || 0,
            updated: "Updated just now",
          };
        })
        .filter((card): card is MicroCard => card !== null);

      if (!importedCards.length) {
        setUploadError("No valid rows were found. Ensure title and description are present.");
        return;
      }

      setMicroCards(prevCards => [...importedCards, ...prevCards]);
      setUploadSuccess(`Imported ${importedCards.length} card(s) from ${uploadedFile.name}.`);
      closeUploadModal();
    }
    catch {
      setUploadError("Could not read this file. Please verify it is UTF-8 encoded CSV.");
    }
  };

  return (
    <>
      <div className="space-y-6 rounded-[15px] border border-[#CED9E5] bg-[#FDFDFD] p-4 shadow-[0_1px_6px_rgba(0,0,0,0.25)] sm:p-6">
        <div className="rounded-[6px] bg-[#01579B] px-4 py-3">
          <h2 className="text-[24px] font-semibold leading-none text-white">Content Management</h2>
        </div>

        <section className="rounded-[12px] border border-[#D9E2EC] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[30px] font-semibold leading-none text-[#0F172A]">Micro-Cards</h3>
              <p className="mt-1 text-sm text-[#64748B]">Manage reusable "How to stay safe" educational snippets.</p>
              {uploadSuccess
                ? <p className="mt-2 text-sm font-medium text-[#0F67AE]">{uploadSuccess}</p>
                : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="search"
                  placeholder="Search cards..."
                  className="h-9 w-full rounded-full border border-[#D5DEE7] bg-white pl-9 pr-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9] sm:w-[220px]"
                />
              </label>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#F59E0B] px-3 text-sm font-medium text-white transition hover:bg-[#D68606]"
              >
                <Upload className="h-4 w-4" />
                Bulk Upload
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0F67AE] px-3 text-sm font-medium text-white transition hover:bg-[#0B578F]"
              >
                <Plus className="h-4 w-4" />
                New Card
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {microCards.map(card => (
              <article key={card.title} className="overflow-hidden rounded-[10px] border border-[#D5DEE7] bg-[#FCFDFE]">
                <div className="h-24 bg-gradient-to-r from-[#184A70] via-[#2A6A95] to-[#1B344C]" />
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[15px] font-semibold text-[#0F172A]">{card.title}</h4>
                    <span className="rounded-full bg-[#DDF7EC] px-2 py-0.5 text-[10px] font-semibold text-[#0E7A56]">{card.tag}</span>
                  </div>
                  <p className="text-xs leading-5 text-[#64748B]">{card.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>
                      {card.views.toLocaleString()}
                      {" views"}
                    </span>
                    <span>{card.updated}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[12px] border border-[#D9E2EC] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[30px] font-semibold leading-none text-[#0F172A]">Resource Directory</h3>
              <p className="mt-1 text-sm text-[#64748B]">Directory of Banks, Legal Aid, and Counseling services.</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#D5DEE7] bg-white px-3 text-sm font-medium text-[#1E3A5F] transition hover:bg-[#F3F7FB]"
            >
              <Plus className="h-4 w-4" />
              Add Resource
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-[10px] border border-[#D5DEE7]">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-[#F8FBFF]">
                <tr className="text-[11px] uppercase tracking-wide text-[#64748B]">
                  <th className="px-4 py-3 font-semibold">Organization Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Region / Availability</th>
                  <th className="px-4 py-3 font-semibold">Contact Info</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(resource => (
                  <tr key={resource.name} className="border-t border-[#E4EAF1] text-sm text-[#1E293B]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF2FC] text-[#0F67AE]">
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        {resource.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryBadgeClassMap[resource.category]}`}>
                        {resource.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#475569]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" />
                        {resource.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#475569]">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#94A3B8]" />
                        {resource.contact}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#4A6780] transition hover:bg-[#EEF3F8]"
                        aria-label={`More actions for ${resource.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isUploadModalOpen
        ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
              <div className="w-full max-w-[760px] rounded-[10px] border border-[#E1E7EF] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.22)]">
                <div className="px-6 pb-4 pt-6 sm:px-8">
                  <h3 className="text-center text-[28px] font-semibold leading-none text-[#0F172A] sm:text-[34px] lg:text-[42px]">Upload Educational Content</h3>
                  <p className="mx-auto mt-3 max-w-[520px] text-center text-[16px] text-[#64748B]">
                    Please upload your educational content using the standard format. Ensure your data matches the template structure before proceeding.
                  </p>
                </div>

                <div className="px-6 sm:px-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={event => onFileSelected(event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      onFileSelected(event.dataTransfer.files?.[0]);
                    }}
                    className={`w-full rounded-[10px] border border-dashed px-6 py-14 text-center transition ${
                      isDraggingFile
                        ? "border-[#0F67AE] bg-[#F2F8FF]"
                        : "border-[#D4DFEC] bg-white hover:bg-[#FAFCFF]"
                    }`}
                  >
                    <span className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2FC] text-[#0F67AE]">
                      <Upload className="h-5 w-5" />
                    </span>
                    <p className="text-[24px] font-semibold leading-none text-[#1E293B]">
                      Drag & drop or
                      {" "}
                      <span className="text-[#0F67AE]">browse</span>
                    </p>
                    <p className="mt-3 text-[14px] text-[#64748B]">Select a CSV file from your computer</p>
                    {uploadedFile
                      ? (
                          <p className="mt-4 rounded-md bg-[#EEF6FF] px-3 py-2 text-sm font-medium text-[#0F67AE]">
                            Selected:
                            {" "}
                            {uploadedFile.name}
                          </p>
                        )
                      : null}
                  </button>
                  {uploadError
                    ? <p className="mt-3 text-sm font-medium text-[#D14343]">{uploadError}</p>
                    : null}
                </div>

                <div className="px-6 pb-6 pt-4 sm:px-8">
                  <div className="rounded-[10px] bg-[#F3F6FA] px-4 py-3">
                    <div className="flex items-start gap-2 text-[#64748B]">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#7B8FA7]" />
                      <div className="text-[12px] leading-6">
                        <p className="font-semibold text-[#4B6075]">File Requirements:</p>
                        <p>- File must be in .csv format</p>
                        <p>- Maximum file size is 5MB</p>
                        <p>- Ensure UTF-8 encoding to prevent character issues</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#E5EAF1] px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="text-[20px] font-medium text-[#334155] transition hover:text-[#1E293B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={importCsvFile}
                    disabled={!uploadedFile}
                    className="inline-flex h-10 min-w-28 items-center justify-center rounded-[6px] bg-[#01579B] px-5 text-[20px] font-medium text-white transition enabled:hover:bg-[#0B4A80] disabled:cursor-not-allowed disabled:bg-[#9FB9D1]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )
        : null}
    </>
  );
}
