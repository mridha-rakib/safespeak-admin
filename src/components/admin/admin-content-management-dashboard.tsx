import {
  Building2,
  Edit3,
  Info,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  createMicroEducationItem,
  deleteMicroEducationItem,
  listAdminMicroEducation,
  type MicroEducationChip,
  type MicroEducationDuration,
  type MicroEducationFormat,
  type MicroEducationInput,
  type MicroEducationItem,
  type MicroEducationStatus,
  type MicroEducationTone,
  updateMicroEducationItem,
} from "@/lib/microeducation";
import {
  createResourceItem,
  deleteResourceItem,
  listAdminResources,
  type ResourceInput,
  type ResourceItem,
  type ResourceStatus,
  updateResourceItem,
} from "@/lib/resources";

const categoryBadgeClassMap: Record<string, string> = {
  "Banks": "bg-[#DCEBFF] text-[#1D5FBF]",
  "Legal Aid": "bg-[#EFE2FF] text-[#7C3AED]",
  "Counseling": "bg-[#DDF7EC] text-[#0F766E]",
};

const defaultCategoryBadgeClass = "bg-[#EAF2FC] text-[#0F67AE]";

const chipOptions: Array<{ label: string; value: MicroEducationChip }> = [
  { label: "Harassment", value: "harassment" },
  { label: "Rights", value: "rights" },
  { label: "Safety", value: "safety" },
  { label: "Mental Health", value: "mentalHealth" },
];

const toneOptions: Array<{ label: string; value: MicroEducationTone }> = [
  { label: "Blue", value: "blue" },
  { label: "Orange", value: "orange" },
  { label: "Green", value: "green" },
  { label: "Amber", value: "amber" },
  { label: "Violet", value: "violet" },
  { label: "Teal", value: "teal" },
];

const durationOptions: Array<{ label: string; value: MicroEducationDuration }> = [
  { label: "Quick", value: "quick" },
  { label: "Deep", value: "deep" },
];

const formatOptions: Array<{ label: string; value: MicroEducationFormat }> = [
  { label: "Video", value: "video" },
  { label: "Interactive", value: "interactive" },
  { label: "Guide", value: "guide" },
];

const statusOptions: Array<{ label: string; value: MicroEducationStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const resourceStatusOptions: Array<{ label: string; value: ResourceStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const defaultEditorValues: MicroEducationInput = {
  title: "",
  summary: "",
  tag: "Safety",
  cta: "Start Now",
  tone: "blue",
  chips: ["safety"],
  duration: "quick",
  format: "guide",
  status: "draft",
  sortOrder: 0,
  views: 0,
};

const defaultResourceValues: ResourceInput = {
  name: "",
  category: "Counseling",
  region: "",
  contact: "",
  status: "published",
  sortOrder: 0,
};

function toStatusLabel(status: MicroEducationStatus | ResourceStatus) {
  return status === "published" ? "Published" : "Draft";
}

function updatedLabel(item: { updatedAt?: string }) {
  if (!item.updatedAt) {
    return "Updated recently";
  }

  return `Updated ${new Date(item.updatedAt).toLocaleDateString()}`;
}

function sortMicroCards(items: MicroEducationItem[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function sortResources(items: ResourceItem[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function AdminContentManagementDashboard() {
  const [microCards, setMicroCards] = useState<MicroEducationItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<MicroEducationItem | null>(null);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [editorValues, setEditorValues] = useState<MicroEducationInput>(defaultEditorValues);
  const [resourceValues, setResourceValues] = useState<ResourceInput>(defaultResourceValues);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxUploadSize = 5 * 1024 * 1024;

  useEffect(() => {
    let isMounted = true;

    const loadCards = async () => {
      setIsLoadingCards(true);
      setUploadError(null);

      try {
        const items = await listAdminMicroEducation();

        if (isMounted) {
          setMicroCards(sortMicroCards(items));
        }
      }
      catch (error) {
        if (isMounted) {
          setUploadError(error instanceof Error ? error.message : "Could not load micro-education cards.");
        }
      }
      finally {
        if (isMounted) {
          setIsLoadingCards(false);
        }
      }
    };

    const loadResources = async () => {
      setIsLoadingResources(true);
      setResourceError(null);

      try {
        const items = await listAdminResources();

        if (isMounted) {
          setResources(sortResources(items));
        }
      }
      catch (error) {
        if (isMounted) {
          setResourceError(error instanceof Error ? error.message : "Could not load resource directory.");
        }
      }
      finally {
        if (isMounted) {
          setIsLoadingResources(false);
        }
      }
    };

    void loadCards();
    void loadResources();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMicroCards = useMemo(() => {
    const normalizedSearch = cardSearch.trim().toLowerCase();

    return microCards.filter((card) => {
      if (!normalizedSearch) {
        return true;
      }

      return card.title.toLowerCase().includes(normalizedSearch)
        || card.summary.toLowerCase().includes(normalizedSearch)
        || card.status.toLowerCase().includes(normalizedSearch)
        || card.tag.toLowerCase().includes(normalizedSearch);
    });
  }, [cardSearch, microCards]);

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
    setStatusMessage(null);
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

  const openEditorModal = (card?: MicroEducationItem) => {
    setEditingCard(card ?? null);
    setEditorError(null);
    setStatusMessage(null);
    setEditorValues(
      card
        ? {
            title: card.title,
            summary: card.summary,
            tag: card.tag,
            cta: card.cta,
            tone: card.tone,
            chips: card.chips.length ? card.chips : ["safety"],
            duration: card.duration,
            format: card.format,
            status: card.status,
            sortOrder: card.sortOrder,
            views: card.views,
          }
        : {
            ...defaultEditorValues,
            sortOrder: microCards.length,
          },
    );
    setIsEditorModalOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorModalOpen(false);
    setEditingCard(null);
    setEditorError(null);
    setIsSaving(false);
  };

  const setEditorValue = <TKey extends keyof MicroEducationInput>(
    key: TKey,
    value: MicroEducationInput[TKey],
  ) => {
    setEditorValues(prev => ({ ...prev, [key]: value }));
  };

  const toggleEditorChip = (chip: MicroEducationChip) => {
    setEditorValues((prev) => {
      const nextChips = prev.chips.includes(chip)
        ? prev.chips.filter(item => item !== chip)
        : [...prev.chips, chip];

      return {
        ...prev,
        chips: nextChips.length ? nextChips : [chip],
      };
    });
  };

  const saveEditorValues = async () => {
    const title = editorValues.title.trim();
    const summary = editorValues.summary.trim();

    if (!title || !summary) {
      setEditorError("Title and description are required.");
      return;
    }

    setIsSaving(true);
    setEditorError(null);

    const payload: MicroEducationInput = {
      ...editorValues,
      title,
      summary,
      tag: editorValues.tag.trim() || "Safety",
      cta: editorValues.cta.trim() || "Start Now",
      chips: editorValues.chips.length ? editorValues.chips : ["safety"],
      sortOrder: Number.isFinite(editorValues.sortOrder) ? editorValues.sortOrder : 0,
      views: Number.isFinite(editorValues.views ?? 0) ? editorValues.views : 0,
    };

    try {
      const savedCard = editingCard
        ? await updateMicroEducationItem(editingCard.id, payload)
        : await createMicroEducationItem(payload);

      setMicroCards(prevCards => sortMicroCards(
        editingCard
          ? prevCards.map(card => (card.id === savedCard.id ? savedCard : card))
          : [savedCard, ...prevCards],
      ));
      setStatusMessage(editingCard ? "Micro-card updated." : "New micro-card draft created.");
      closeEditorModal();
    }
    catch (error) {
      setEditorError(error instanceof Error ? error.message : "Could not save this card.");
    }
    finally {
      setIsSaving(false);
    }
  };

  const deleteCard = async (card: MicroEducationItem) => {
    const confirmed = window.confirm(`Delete "${card.title}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingCardId(card.id);
    setUploadError(null);

    try {
      await deleteMicroEducationItem(card.id);
      setMicroCards(prevCards => prevCards.filter(item => item.id !== card.id));
      setStatusMessage("Micro-card deleted.");
    }
    catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not delete this card.");
    }
    finally {
      setDeletingCardId(null);
    }
  };

  const openResourceModal = (resource?: ResourceItem) => {
    setEditingResource(resource ?? null);
    setResourceError(null);
    setStatusMessage(null);
    setResourceValues(
      resource
        ? {
            name: resource.name,
            category: resource.category,
            region: resource.region,
            contact: resource.contact,
            status: resource.status,
            sortOrder: resource.sortOrder,
          }
        : {
            ...defaultResourceValues,
            sortOrder: resources.length,
          },
    );
    setIsResourceModalOpen(true);
  };

  const closeResourceModal = () => {
    setIsResourceModalOpen(false);
    setEditingResource(null);
    setResourceError(null);
    setIsSavingResource(false);
  };

  const setResourceValue = <TKey extends keyof ResourceInput>(
    key: TKey,
    value: ResourceInput[TKey],
  ) => {
    setResourceValues(prev => ({ ...prev, [key]: value }));
  };

  const saveResourceValues = async () => {
    const name = resourceValues.name.trim();
    const category = resourceValues.category.trim();
    const region = resourceValues.region.trim();
    const contact = resourceValues.contact.trim();

    if (!name || !category || !region || !contact) {
      setResourceError("Name, category, region, and contact are required.");
      return;
    }

    setIsSavingResource(true);
    setResourceError(null);

    const payload: ResourceInput = {
      ...resourceValues,
      name,
      category,
      region,
      contact,
      sortOrder: Number.isFinite(resourceValues.sortOrder) ? resourceValues.sortOrder : 0,
    };

    try {
      const savedResource = editingResource
        ? await updateResourceItem(editingResource.id, payload)
        : await createResourceItem(payload);

      setResources(prevResources => sortResources(
        editingResource
          ? prevResources.map(resource => (resource.id === savedResource.id ? savedResource : resource))
          : [savedResource, ...prevResources],
      ));
      setStatusMessage(editingResource ? "Resource updated." : "Resource added.");
      closeResourceModal();
    }
    catch (error) {
      setResourceError(error instanceof Error ? error.message : "Could not save this resource.");
    }
    finally {
      setIsSavingResource(false);
    }
  };

  const deleteResource = async (resource: ResourceItem) => {
    const confirmed = window.confirm(`Delete "${resource.name}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingResourceId(resource.id);
    setResourceError(null);

    try {
      await deleteResourceItem(resource.id);
      setResources(prevResources => prevResources.filter(item => item.id !== resource.id));
      setStatusMessage("Resource deleted.");
    }
    catch (error) {
      setResourceError(error instanceof Error ? error.message : "Could not delete this resource.");
    }
    finally {
      setDeletingResourceId(null);
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
      const descriptionIndex = headers.findIndex(header => header === "description" || header === "summary");
      const tagIndex = headers.findIndex(header => header === "tag" || header === "category");
      const statusIndex = headers.findIndex(header => header === "status" || header === "publishstatus");
      const viewsIndex = headers.indexOf("views");
      const ctaIndex = headers.indexOf("cta");
      const toneIndex = headers.indexOf("tone");
      const chipsIndex = headers.indexOf("chips");
      const durationIndex = headers.indexOf("duration");
      const formatIndex = headers.indexOf("format");
      const sortOrderIndex = headers.findIndex(header => header === "sortorder" || header === "order");

      if (titleIndex === -1 || descriptionIndex === -1) {
        setUploadError("CSV headers must include at least: title, description.");
        return;
      }

      const importedInputs: MicroEducationInput[] = lines
        .slice(1)
        .map((line, index): MicroEducationInput | null => {
          const row = parseCsvLine(line);
          const title = row[titleIndex]?.trim();
          const summary = row[descriptionIndex]?.trim();
          const statusRaw = statusIndex >= 0 ? row[statusIndex]?.trim().toLowerCase() : "";
          const toneRaw = toneIndex >= 0 ? row[toneIndex]?.trim() : "";
          const chipsRaw = chipsIndex >= 0 ? row[chipsIndex]?.trim() : "";
          const durationRaw = durationIndex >= 0 ? row[durationIndex]?.trim() : "";
          const formatRaw = formatIndex >= 0 ? row[formatIndex]?.trim() : "";
          const viewsRaw = viewsIndex >= 0 ? row[viewsIndex] : "";
          const sortOrderRaw = sortOrderIndex >= 0 ? row[sortOrderIndex] : "";
          const status: MicroEducationStatus = statusRaw === "published" ? "published" : "draft";

          if (!title || !summary) {
            return null;
          }

          const chips = chipsRaw
            .split("|")
            .map(chip => chip.trim())
            .filter((chip): chip is MicroEducationChip =>
              chipOptions.some(option => option.value === chip),
            );

          return {
            title,
            summary,
            tag: tagIndex >= 0 && row[tagIndex]?.trim() ? row[tagIndex].trim() : "Safety",
            cta: ctaIndex >= 0 && row[ctaIndex]?.trim() ? row[ctaIndex].trim() : "Start Now",
            tone: toneOptions.some(option => option.value === toneRaw) ? (toneRaw as MicroEducationTone) : "blue",
            chips: chips.length ? chips : ["safety"],
            duration: durationOptions.some(option => option.value === durationRaw)
              ? (durationRaw as MicroEducationDuration)
              : "quick",
            format: formatOptions.some(option => option.value === formatRaw)
              ? (formatRaw as MicroEducationFormat)
              : "guide",
            status,
            views: Number.parseInt(viewsRaw ?? "", 10) || 0,
            sortOrder: Number.parseInt(sortOrderRaw ?? "", 10) || microCards.length + index,
          };
        })
        .filter((card): card is MicroEducationInput => card !== null);

      if (!importedInputs.length) {
        setUploadError("No valid rows were found. Ensure title and description are present.");
        return;
      }

      const importedCards = await Promise.all(importedInputs.map(input => createMicroEducationItem(input)));

      setMicroCards(prevCards => sortMicroCards([...importedCards, ...prevCards]));
      setStatusMessage(`Imported ${importedCards.length} card(s) from ${uploadedFile.name}.`);
      closeUploadModal();
    }
    catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not read this file. Please verify it is UTF-8 encoded CSV.");
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
              {statusMessage
                ? <p className="mt-2 text-sm font-medium text-[#0F67AE]">{statusMessage}</p>
                : null}
              {uploadError
                ? <p className="mt-2 text-sm font-medium text-[#D14343]">{uploadError}</p>
                : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative block w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="search"
                  value={cardSearch}
                  onChange={event => setCardSearch(event.target.value)}
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
                onClick={() => openEditorModal()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0F67AE] px-3 text-sm font-medium text-white transition hover:bg-[#0B578F]"
              >
                <Plus className="h-4 w-4" />
                New Card
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {isLoadingCards
              ? (
                  <div className="rounded-[10px] border border-dashed border-[#D5DEE7] bg-[#FCFDFE] px-4 py-10 text-center text-sm text-[#64748B]">
                    Loading micro-cards...
                  </div>
                )
              : null}
            {!isLoadingCards && filteredMicroCards.map(card => (
              <article key={card.id} className="overflow-hidden rounded-[10px] border border-[#D5DEE7] bg-[#FCFDFE]">
                <div className="h-24 bg-gradient-to-r from-[#184A70] via-[#2A6A95] to-[#1B344C]" />
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[15px] font-semibold text-[#0F172A]">{card.title}</h4>
                    <span className="rounded-full bg-[#DDF7EC] px-2 py-0.5 text-[10px] font-semibold text-[#0E7A56]">{toStatusLabel(card.status)}</span>
                  </div>
                  <p className="text-xs leading-5 text-[#64748B]">{card.summary}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>
                      {card.views.toLocaleString()}
                      {" views"}
                    </span>
                    <span>{updatedLabel(card)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#E4EAF1] pt-2">
                    <span className="text-[11px] font-medium text-[#64748B]">{card.tag}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditorModal(card)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#4A6780] transition hover:bg-[#EEF3F8]"
                        aria-label={`Edit ${card.title}`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCard(card)}
                        disabled={deletingCardId === card.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#D14343] transition hover:bg-[#FFF1F2] disabled:opacity-60"
                        aria-label={`Delete ${card.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!isLoadingCards && filteredMicroCards.length === 0
              ? (
                  <div className="rounded-[10px] border border-dashed border-[#D5DEE7] bg-[#FCFDFE] px-4 py-10 text-center text-sm text-[#64748B]">
                    No micro-cards matched your search.
                  </div>
                )
              : null}
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
              onClick={() => openResourceModal()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#D5DEE7] bg-white px-3 text-sm font-medium text-[#1E3A5F] transition hover:bg-[#F3F7FB]"
            >
              <Plus className="h-4 w-4" />
              Add Resource
            </button>
          </div>
          {resourceError
            ? <p className="mt-2 text-sm font-medium text-[#D14343]">{resourceError}</p>
            : null}

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
                {isLoadingResources
                  ? (
                      <tr className="border-t border-[#E4EAF1] text-sm text-[#64748B]">
                        <td className="px-4 py-8 text-center" colSpan={5}>Loading resources...</td>
                      </tr>
                    )
                  : null}
                {resources.map(resource => (
                  <tr key={resource.id} className="border-t border-[#E4EAF1] text-sm text-[#1E293B]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF2FC] text-[#0F67AE]">
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        {resource.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryBadgeClassMap[resource.category] ?? defaultCategoryBadgeClass}`}>
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
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openResourceModal(resource)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#4A6780] transition hover:bg-[#EEF3F8]"
                          aria-label={`Edit ${resource.name}`}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteResource(resource)}
                          disabled={deletingResourceId === resource.id}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#D14343] transition hover:bg-[#FFF1F2] disabled:opacity-60"
                          aria-label={`Delete ${resource.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoadingResources && resources.length === 0
                  ? (
                      <tr className="border-t border-[#E4EAF1] text-sm text-[#64748B]">
                        <td className="px-4 py-8 text-center" colSpan={5}>No resources have been added yet.</td>
                      </tr>
                    )
                  : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isResourceModalOpen
        ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
              <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[10px] border border-[#E1E7EF] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.22)]">
                <div className="px-6 pb-4 pt-6 sm:px-8">
                  <h3 className="text-center text-[28px] font-semibold leading-none text-[#0F172A] sm:text-[34px] lg:text-[42px]">
                    {editingResource ? "Edit Resource" : "Add Resource"}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[520px] text-center text-[16px] text-[#64748B]">
                    Add a single organization to the resource directory.
                  </p>
                </div>

                <div className="grid gap-4 px-6 sm:grid-cols-2 sm:px-8">
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Organization Name</span>
                    <input
                      value={resourceValues.name}
                      onChange={event => setResourceValue("name", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Category</span>
                    <input
                      value={resourceValues.category}
                      onChange={event => setResourceValue("category", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Region / Availability</span>
                    <input
                      value={resourceValues.region}
                      onChange={event => setResourceValue("region", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Contact Info</span>
                    <input
                      value={resourceValues.contact}
                      onChange={event => setResourceValue("contact", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Status</span>
                    <select
                      value={resourceValues.status}
                      onChange={event => setResourceValue("status", event.target.value as ResourceStatus)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      {resourceStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Sort Order</span>
                    <input
                      type="number"
                      min={0}
                      value={resourceValues.sortOrder}
                      onChange={event => setResourceValue("sortOrder", Number.parseInt(event.target.value, 10) || 0)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  {resourceError
                    ? <p className="sm:col-span-2 text-sm font-medium text-[#D14343]">{resourceError}</p>
                    : null}
                </div>

                <div className="flex items-center justify-between border-t border-[#E5EAF1] px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={closeResourceModal}
                    className="text-[20px] font-medium text-[#334155] transition hover:text-[#1E293B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveResourceValues()}
                    disabled={isSavingResource}
                    className="inline-flex h-10 min-w-28 items-center justify-center rounded-[6px] bg-[#01579B] px-5 text-[20px] font-medium text-white transition enabled:hover:bg-[#0B4A80] disabled:cursor-not-allowed disabled:bg-[#9FB9D1]"
                  >
                    {isSavingResource ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )
        : null}

      {isEditorModalOpen
        ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
              <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[10px] border border-[#E1E7EF] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.22)]">
                <div className="px-6 pb-4 pt-6 sm:px-8">
                  <h3 className="text-center text-[28px] font-semibold leading-none text-[#0F172A] sm:text-[34px] lg:text-[42px]">
                    {editingCard ? "Edit Educational Content" : "Create Educational Content"}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[520px] text-center text-[16px] text-[#64748B]">
                    Manage the data that appears in the user micro-education view.
                  </p>
                </div>

                <div className="grid gap-4 px-6 sm:grid-cols-2 sm:px-8">
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Title</span>
                    <input
                      value={editorValues.title}
                      onChange={event => setEditorValue("title", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Description</span>
                    <textarea
                      value={editorValues.summary}
                      onChange={event => setEditorValue("summary", event.target.value)}
                      className="min-h-24 w-full rounded-[6px] border border-[#D5DEE7] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Tag</span>
                    <input
                      value={editorValues.tag}
                      onChange={event => setEditorValue("tag", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Button Label</span>
                    <input
                      value={editorValues.cta}
                      onChange={event => setEditorValue("cta", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Status</span>
                    <select
                      value={editorValues.status}
                      onChange={event => setEditorValue("status", event.target.value as MicroEducationStatus)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Tone</span>
                    <select
                      value={editorValues.tone}
                      onChange={event => setEditorValue("tone", event.target.value as MicroEducationTone)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      {toneOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Duration</span>
                    <select
                      value={editorValues.duration}
                      onChange={event => setEditorValue("duration", event.target.value as MicroEducationDuration)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      {durationOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Format</span>
                    <select
                      value={editorValues.format}
                      onChange={event => setEditorValue("format", event.target.value as MicroEducationFormat)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      {formatOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Sort Order</span>
                    <input
                      type="number"
                      min={0}
                      value={editorValues.sortOrder}
                      onChange={event => setEditorValue("sortOrder", Number.parseInt(event.target.value, 10) || 0)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-sm font-semibold text-[#334155]">Filters</p>
                    <div className="flex flex-wrap gap-2">
                      {chipOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleEditorChip(option.value)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            editorValues.chips.includes(option.value)
                              ? "border-[#0F67AE] bg-[#EEF6FF] text-[#0F67AE]"
                              : "border-[#D5DEE7] bg-white text-[#64748B] hover:bg-[#F8FBFF]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editorError
                    ? <p className="sm:col-span-2 text-sm font-medium text-[#D14343]">{editorError}</p>
                    : null}
                </div>

                <div className="flex items-center justify-between border-t border-[#E5EAF1] px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={closeEditorModal}
                    className="text-[20px] font-medium text-[#334155] transition hover:text-[#1E293B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveEditorValues()}
                    disabled={isSaving}
                    className="inline-flex h-10 min-w-28 items-center justify-center rounded-[6px] bg-[#01579B] px-5 text-[20px] font-medium text-white transition enabled:hover:bg-[#0B4A80] disabled:cursor-not-allowed disabled:bg-[#9FB9D1]"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )
        : null}

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
                    onClick={() => void importCsvFile()}
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
