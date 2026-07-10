import {
  Building2,
  Edit3,
  ImagePlus,
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
  createMicroEducationCategory,
  createMicroEducationItem,
  deleteMicroEducationCategory,
  deleteMicroEducationItem,
  getMicroEducationImageUrl,
  listAdminMicroEducationCategories,
  listAdminMicroEducation,
  type MicroEducationCategory,
  type MicroEducationCategoryInput,
  type MicroEducationCategoryStatus,
  type MicroEducationChip,
  type MicroEducationDuration,
  type MicroEducationFormat,
  type MicroEducationInput,
  type MicroEducationItem,
  type MicroEducationStatus,
  type MicroEducationTone,
  updateMicroEducationCategory,
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

const categoryStatusOptions: Array<{ label: string; value: MicroEducationCategoryStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const resourceStatusOptions: Array<{ label: string; value: ResourceStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const resourceCategoryOptions = [
  "Banks",
  "Legal Aid",
  "Counseling",
  "Community",
  "Housing",
  "Crisis Support",
  "Financial",
  "Other",
];

const defaultEditorValues: MicroEducationInput = {
  title: "",
  summary: "",
  readTimeLabel: "4 min read",
  tag: "Safety",
  cta: "Start Now",
  detailHeading: "",
  detailSummary: "",
  detailBody: "",
  detailTakeaway: "",
  imageAlt: "",
  categoryId: "",
  tone: "blue",
  chips: ["safety"],
  duration: "quick",
  format: "guide",
  status: "draft",
  sortOrder: 0,
  views: 0,
};

const defaultCategoryValues: MicroEducationCategoryInput = {
  name: "",
  description: "",
  backgroundColor: "#01579B",
  textColor: "#FFFFFF",
  iconName: "shield",
  imageUrl: "",
  status: "draft",
  sortOrder: 0,
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

function sortCategories(items: MicroEducationCategory[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

function sortResources(items: ResourceItem[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function AdminContentManagementDashboard() {
  const [categories, setCategories] = useState<MicroEducationCategory[]>([]);
  const [microCards, setMicroCards] = useState<MicroEducationItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MicroEducationCategory | null>(null);
  const [editingCard, setEditingCard] = useState<MicroEducationItem | null>(null);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [categoryValues, setCategoryValues] = useState<MicroEducationCategoryInput>(defaultCategoryValues);
  const [editorValues, setEditorValues] = useState<MicroEducationInput>(defaultEditorValues);
  const [editorImageFile, setEditorImageFile] = useState<File | null>(null);
  const [resourceValues, setResourceValues] = useState<ResourceInput>(defaultResourceValues);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const maxUploadSize = 5 * 1024 * 1024;
  const editorImagePreviewUrl = useMemo(() => {
    if (editorImageFile) {
      return URL.createObjectURL(editorImageFile);
    }

    return editingCard ? getMicroEducationImageUrl(editingCard) : undefined;
  }, [editingCard, editorImageFile]);

  useEffect(() => {
    return () => {
      if (editorImageFile && editorImagePreviewUrl) {
        URL.revokeObjectURL(editorImagePreviewUrl);
      }
    };
  }, [editorImageFile, editorImagePreviewUrl]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);

      try {
        const items = await listAdminMicroEducationCategories();

        if (isMounted) {
          setCategories(sortCategories(items));
        }
      }
      catch (error) {
        if (isMounted) {
          setCategoryError(error instanceof Error ? error.message : "Could not load micro-education categories.");
        }
      }
      finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

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

    void loadCategories();
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

  const defaultCategoryId = categories[0]?.id ?? "";

  const resolveCategoryIdFromName = (value: string) => {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return defaultCategoryId;
    }

    return categories.find(category =>
      category.id === value || category.name.trim().toLowerCase() === normalizedValue
    )?.id ?? defaultCategoryId;
  };

  const openCategoryModal = (category?: MicroEducationCategory) => {
    setEditingCategory(category ?? null);
    setCategoryError(null);
    setStatusMessage(null);
    setCategoryValues(
      category
        ? {
            name: category.name,
            description: category.description ?? "",
            backgroundColor: category.backgroundColor,
            textColor: category.textColor,
            iconName: category.iconName ?? "",
            imageUrl: category.imageUrl ?? "",
            status: category.status,
            sortOrder: category.sortOrder,
          }
        : {
            ...defaultCategoryValues,
            sortOrder: categories.length,
          },
    );
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryError(null);
    setIsSavingCategory(false);
  };

  const setCategoryValue = <TKey extends keyof MicroEducationCategoryInput>(
    key: TKey,
    value: MicroEducationCategoryInput[TKey],
  ) => {
    setCategoryValues(prev => ({ ...prev, [key]: value }));
  };

  const saveCategoryValues = async () => {
    const name = categoryValues.name.trim();

    if (!name) {
      setCategoryError("Category name is required.");
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    const payload: MicroEducationCategoryInput = {
      ...categoryValues,
      name,
      description: categoryValues.description?.trim() || undefined,
      iconName: categoryValues.iconName?.trim() || undefined,
      imageUrl: categoryValues.imageUrl?.trim() || undefined,
      sortOrder: Number.isFinite(categoryValues.sortOrder) ? categoryValues.sortOrder : 0,
    };

    try {
      const savedCategory = editingCategory
        ? await updateMicroEducationCategory(editingCategory.id, payload)
        : await createMicroEducationCategory(payload);

      setCategories(prevCategories => sortCategories(
        editingCategory
          ? prevCategories.map(category => (category.id === savedCategory.id ? savedCategory : category))
          : [savedCategory, ...prevCategories],
      ));
      setStatusMessage(editingCategory ? "Category updated." : "New category created.");
      closeCategoryModal();
    }
    catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Could not save this category.");
    }
    finally {
      setIsSavingCategory(false);
    }
  };

  const deleteCategory = async (category: MicroEducationCategory) => {
    const confirmed = window.confirm(`Delete "${category.name}"? Cards assigned to it must be moved first.`);

    if (!confirmed) {
      return;
    }

    setDeletingCategoryId(category.id);
    setCategoryError(null);

    try {
      await deleteMicroEducationCategory(category.id);
      setCategories(prevCategories => prevCategories.filter(item => item.id !== category.id));
      setStatusMessage("Category deleted.");
    }
    catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Could not delete this category.");
    }
    finally {
      setDeletingCategoryId(null);
    }
  };

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
    setEditorImageFile(null);
    if (editorImageInputRef.current) {
      editorImageInputRef.current.value = "";
    }
    setEditorValues(
      card
        ? {
            title: card.title,
            summary: card.summary,
            readTimeLabel: card.readTimeLabel || "4 min read",
            tag: card.tag,
            cta: card.cta,
            detailHeading: card.detailHeading || card.title,
            detailSummary: card.detailSummary ?? "",
            detailBody: card.detailBody || card.summary,
            detailTakeaway: card.detailTakeaway || card.summary,
            imageAlt: card.imageAlt ?? "",
            categoryId: card.categoryId ?? card.category?.id ?? defaultCategoryId,
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
            categoryId: defaultCategoryId,
            sortOrder: microCards.length,
          },
    );
    setIsEditorModalOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorModalOpen(false);
    setEditingCard(null);
    setEditorImageFile(null);
    setEditorError(null);
    setIsSaving(false);
    if (editorImageInputRef.current) {
      editorImageInputRef.current.value = "";
    }
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

  const onEditorImageSelected = (file?: File) => {
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setEditorError("Image must be a JPG, PNG, WebP, or GIF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setEditorError("Image is too large. Maximum size is 10MB.");
      return;
    }

    setEditorImageFile(file);
    setEditorError(null);
  };

  const saveEditorValues = async () => {
    const title = editorValues.title.trim();
    const summary = editorValues.summary.trim();
    const detailHeading = editorValues.detailHeading.trim();
    const detailBody = editorValues.detailBody.trim();
    const detailTakeaway = editorValues.detailTakeaway.trim();

    if (!title || !summary || !detailHeading || !detailBody || !detailTakeaway) {
      setEditorError("Title, description, detail heading, detail body, and key takeaway are required.");
      return;
    }

    if (!editorValues.categoryId) {
      setEditorError("Category is required. Create a category before saving this card.");
      return;
    }

    setIsSaving(true);
    setEditorError(null);

    const payload: MicroEducationInput = {
      ...editorValues,
      title,
      summary,
      readTimeLabel: editorValues.readTimeLabel.trim() || "4 min read",
      tag: editorValues.tag.trim() || "Safety",
      cta: editorValues.cta.trim() || "Start Now",
      detailHeading,
      detailSummary: editorValues.detailSummary?.trim() || summary,
      detailBody,
      detailTakeaway,
      imageAlt: editorValues.imageAlt?.trim() || title,
      categoryId: editorValues.categoryId,
      chips: editorValues.chips.length ? editorValues.chips : ["safety"],
      sortOrder: Number.isFinite(editorValues.sortOrder) ? editorValues.sortOrder : 0,
      views: Number.isFinite(editorValues.views ?? 0) ? editorValues.views : 0,
      imageFile: editorImageFile,
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
      const updatedCategories = await listAdminMicroEducationCategories();
      setCategories(sortCategories(updatedCategories));
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
      const updatedCategories = await listAdminMicroEducationCategories();
      setCategories(sortCategories(updatedCategories));
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
      const readTimeIndex = headers.findIndex(header => header === "readtime" || header === "readtimelabel");
      const detailHeadingIndex = headers.findIndex(header => header === "detailheading" || header === "headline");
      const detailSummaryIndex = headers.findIndex(header => header === "detailsummary" || header === "articlesummary");
      const detailBodyIndex = headers.findIndex(header => header === "detailbody" || header === "body" || header === "articlebody");
      const detailTakeawayIndex = headers.findIndex(header => header === "detailtakeaway" || header === "takeaway");
      const imageAltIndex = headers.findIndex(header => header === "imagealt" || header === "alt");
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
          const readTimeRaw = readTimeIndex >= 0 ? row[readTimeIndex]?.trim() : "";
          const detailHeadingRaw = detailHeadingIndex >= 0 ? row[detailHeadingIndex]?.trim() : "";
          const detailSummaryRaw = detailSummaryIndex >= 0 ? row[detailSummaryIndex]?.trim() : "";
          const detailBodyRaw = detailBodyIndex >= 0 ? row[detailBodyIndex]?.trim() : "";
          const detailTakeawayRaw = detailTakeawayIndex >= 0 ? row[detailTakeawayIndex]?.trim() : "";
          const imageAltRaw = imageAltIndex >= 0 ? row[imageAltIndex]?.trim() : "";
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
            readTimeLabel: readTimeRaw || "4 min read",
            tag: tagIndex >= 0 && row[tagIndex]?.trim() ? row[tagIndex].trim() : "Safety",
            cta: ctaIndex >= 0 && row[ctaIndex]?.trim() ? row[ctaIndex].trim() : "Start Now",
            detailHeading: detailHeadingRaw || title,
            detailSummary: detailSummaryRaw || summary,
            detailBody: detailBodyRaw || summary,
            detailTakeaway: detailTakeawayRaw || summary,
            imageAlt: imageAltRaw || title,
            categoryId: resolveCategoryIdFromName(tagIndex >= 0 ? row[tagIndex]?.trim() ?? "" : ""),
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
              <h3 className="text-[26px] font-semibold leading-tight text-[#0F172A]">Micro-Education Categories</h3>
              <p className="mt-1 text-sm text-[#64748B]">Manage the category cards users see before opening micro-cards.</p>
              {categoryError
                ? <p className="mt-2 text-sm font-medium text-[#D14343]">{categoryError}</p>
                : null}
            </div>
            <button
              type="button"
              onClick={() => openCategoryModal()}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#0F67AE] px-4 text-sm font-semibold text-white transition hover:bg-[#0B578F]"
            >
              <Plus className="h-4 w-4" />
              New Category
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {isLoadingCategories
              ? (
                  <div className="rounded-[10px] border border-dashed border-[#D5DEE7] bg-[#FCFDFE] px-4 py-10 text-center text-sm text-[#64748B]">
                    Loading categories...
                  </div>
                )
              : null}
            {!isLoadingCategories && categories.map(category => (
              <article key={category.id} className="overflow-hidden rounded-[10px] border border-[#D5DEE7] bg-[#FCFDFE]">
                <div
                  className="min-h-[126px] p-4"
                  style={{ backgroundColor: category.backgroundColor, color: category.textColor }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                        {category.status === "published" ? "Published" : "Draft"}
                      </p>
                      <h4 className="mt-2 text-xl font-bold leading-tight">{category.name}</h4>
                      {category.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 opacity-85">{category.description}</p>
                      ) : null}
                    </div>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/20 text-xs font-bold">
                      {(category.iconName || category.name).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#E4EAF1] p-3">
                  <div className="text-[11px] text-[#64748B]">
                    <span className="font-semibold">{category.cardCount ?? 0}</span>
                    {" cards | Order "}
                    {category.sortOrder}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openCategoryModal(category)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#4A6780] transition hover:bg-[#EEF3F8]"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteCategory(category)}
                      disabled={deletingCategoryId === category.id}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#D14343] transition hover:bg-[#FFF1F2] disabled:opacity-60"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!isLoadingCategories && categories.length === 0
              ? (
                  <div className="rounded-[10px] border border-dashed border-[#D5DEE7] bg-[#FCFDFE] px-4 py-10 text-center text-sm text-[#64748B]">
                    Create a category before publishing micro-cards.
                  </div>
                )
              : null}
          </div>
        </section>

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
                {getMicroEducationImageUrl(card) ? (
                  <div
                    aria-hidden="true"
                    style={{ backgroundImage: `url(${getMicroEducationImageUrl(card)})` }}
                    className="h-24 bg-cover bg-center"
                  />
                ) : (
                  <div className="h-24 bg-gradient-to-r from-[#184A70] via-[#2A6A95] to-[#1B344C]" />
                )}
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
                    <span className="text-[11px] font-medium text-[#64748B]">
                      {card.category?.name ?? categories.find(category => category.id === card.categoryId)?.name ?? "Uncategorized"}
                    </span>
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
              <h3 className="text-[26px] font-semibold leading-tight text-[#0F172A]">Resource Directory</h3>
              <p className="mt-1 text-sm text-[#64748B]">Directory of banks, legal aid, counseling, and local support services.</p>
            </div>
            <button
              type="button"
              onClick={() => openResourceModal()}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#C9D8E8] bg-white px-4 text-sm font-semibold text-[#1E3A5F] transition hover:bg-[#F3F7FB]"
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
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingResources
                  ? (
                      <tr className="border-t border-[#E4EAF1] text-sm text-[#64748B]">
                        <td className="px-4 py-8 text-center" colSpan={6}>Loading resources...</td>
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
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${resource.status === "published" ? "bg-[#DCFCE7] text-[#047857]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                        {toStatusLabel(resource.status)}
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
                        <td className="px-4 py-8 text-center" colSpan={6}>No resources have been added yet.</td>
                      </tr>
                    )
                  : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isCategoryModalOpen
        ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#111827]/50 p-4 py-6">
              <div className="flex w-full max-w-[720px] flex-col overflow-hidden rounded-[12px] border border-[#D8E3EE] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                <div className="border-b border-[#E5EAF1] px-6 py-5 sm:px-8">
                  <h3 className="text-[26px] font-semibold leading-none text-[#0F172A] sm:text-[32px]">
                    {editingCategory ? "Edit Category" : "Create Category"}
                  </h3>
                  <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#64748B]">
                    Configure the category card shown before users open micro-education cards.
                  </p>
                </div>

                <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 sm:px-8">
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Name</span>
                    <input
                      value={categoryValues.name}
                      onChange={event => setCategoryValue("name", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Description</span>
                    <textarea
                      value={categoryValues.description ?? ""}
                      onChange={event => setCategoryValue("description", event.target.value)}
                      className="min-h-20 w-full rounded-[6px] border border-[#D5DEE7] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Background Color</span>
                    <input
                      type="color"
                      value={categoryValues.backgroundColor}
                      onChange={event => setCategoryValue("backgroundColor", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] bg-white px-2 py-1"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Text Color</span>
                    <input
                      type="color"
                      value={categoryValues.textColor}
                      onChange={event => setCategoryValue("textColor", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] bg-white px-2 py-1"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Icon Name</span>
                    <input
                      value={categoryValues.iconName ?? ""}
                      onChange={event => setCategoryValue("iconName", event.target.value)}
                      placeholder="shield"
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Image URL</span>
                    <input
                      value={categoryValues.imageUrl ?? ""}
                      onChange={event => setCategoryValue("imageUrl", event.target.value)}
                      placeholder="Optional"
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Status</span>
                    <select
                      value={categoryValues.status}
                      onChange={event => setCategoryValue("status", event.target.value as MicroEducationCategoryStatus)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      {categoryStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Sort Order</span>
                    <input
                      type="number"
                      min={0}
                      value={categoryValues.sortOrder}
                      onChange={event => setCategoryValue("sortOrder", Number.parseInt(event.target.value, 10) || 0)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <div
                      className="rounded-[10px] p-4"
                      style={{ backgroundColor: categoryValues.backgroundColor, color: categoryValues.textColor }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Preview</p>
                      <h4 className="mt-2 text-xl font-bold">{categoryValues.name || "Category name"}</h4>
                      <p className="mt-1 text-xs opacity-85">{categoryValues.description || "Category description appears here."}</p>
                    </div>
                  </div>
                  {categoryError
                    ? <p className="text-sm font-medium text-[#D14343] sm:col-span-2">{categoryError}</p>
                    : null}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-[#E5EAF1] px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#C9D8E8] px-4 text-sm font-semibold text-[#1E3A5F] transition hover:bg-[#F3F7FB]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveCategoryValues()}
                    disabled={isSavingCategory}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#0F67AE] px-5 text-sm font-semibold text-white transition hover:bg-[#0B578F] disabled:opacity-60"
                  >
                    {isSavingCategory ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </div>
            </div>
          )
        : null}

      {isResourceModalOpen
        ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#111827]/50 p-4 py-6">
              <div className="flex w-full max-w-[820px] flex-col overflow-hidden rounded-[12px] border border-[#D8E3EE] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                <div className="border-b border-[#E5EAF1] px-6 py-5 sm:px-8">
                  <h3 className="text-[26px] font-semibold leading-none text-[#0F172A] sm:text-[32px]">
                    {editingResource ? "Edit Resource" : "Add Resource"}
                  </h3>
                  <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#64748B]">
                    Manage the support organization data that appears in the client resource directory.
                  </p>
                </div>

                <div className="grid max-h-[calc(100vh-220px)] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2 sm:px-8">
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
                    <select
                      value={resourceValues.category}
                      onChange={event => setResourceValue("category", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      {resourceCategoryOptions.includes(resourceValues.category) ? null : (
                        <option value={resourceValues.category}>{resourceValues.category}</option>
                      )}
                      {resourceCategoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
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
                      placeholder="Phone, email, website, or referral note"
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
                    className="inline-flex h-10 items-center rounded-[6px] px-3 text-sm font-semibold text-[#334155] transition hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveResourceValues()}
                    disabled={isSavingResource}
                    className="inline-flex h-10 min-w-28 items-center justify-center rounded-[6px] bg-[#01579B] px-5 text-sm font-semibold text-white transition enabled:hover:bg-[#0B4A80] disabled:cursor-not-allowed disabled:bg-[#9FB9D1]"
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
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#111827]/50 p-4 py-6">
              <div className="flex w-full max-w-[880px] flex-col overflow-hidden rounded-[12px] border border-[#D8E3EE] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                <div className="border-b border-[#E5EAF1] px-6 py-5 sm:px-8">
                  <h3 className="text-[26px] font-semibold leading-none text-[#0F172A] sm:text-[32px]">
                    {editingCard ? "Edit Educational Content" : "Create Educational Content"}
                  </h3>
                  <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#64748B]">
                    Manage the data that appears in the user micro-education view.
                  </p>
                </div>

                <div className="grid max-h-[calc(100vh-220px)] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2 sm:px-8">
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
                    <span className="text-sm font-semibold text-[#334155]">Read Time</span>
                    <input
                      value={editorValues.readTimeLabel}
                      onChange={event => setEditorValue("readTimeLabel", event.target.value)}
                      placeholder="4 min read"
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Image Alt Text</span>
                    <input
                      value={editorValues.imageAlt ?? ""}
                      onChange={event => setEditorValue("imageAlt", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Detail Heading</span>
                    <input
                      value={editorValues.detailHeading}
                      onChange={event => setEditorValue("detailHeading", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Detail Summary</span>
                    <textarea
                      value={editorValues.detailSummary ?? ""}
                      onChange={event => setEditorValue("detailSummary", event.target.value)}
                      className="min-h-20 w-full rounded-[6px] border border-[#D5DEE7] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Detail Body</span>
                    <textarea
                      value={editorValues.detailBody}
                      onChange={event => setEditorValue("detailBody", event.target.value)}
                      className="min-h-28 w-full rounded-[6px] border border-[#D5DEE7] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Key Takeaway</span>
                    <textarea
                      value={editorValues.detailTakeaway}
                      onChange={event => setEditorValue("detailTakeaway", event.target.value)}
                      className="min-h-20 w-full rounded-[6px] border border-[#D5DEE7] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    />
                  </label>
                  <div className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-semibold text-[#334155]">Image (Optional)</span>
                    <input
                      ref={editorImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={event => onEditorImageSelected(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => editorImageInputRef.current?.click()}
                      onDragOver={event => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        onEditorImageSelected(event.dataTransfer.files?.[0]);
                      }}
                      className="flex min-h-[112px] w-full items-center gap-4 rounded-[8px] border border-dashed border-[#C9D8E8] bg-[#FAFCFF] p-4 text-left transition hover:border-[#0F67AE] hover:bg-[#F4F9FF]"
                    >
                      {editorImagePreviewUrl ? (
                        <span
                          aria-hidden="true"
                          style={{ backgroundImage: `url(${editorImagePreviewUrl})` }}
                          className="h-20 w-28 shrink-0 rounded-[8px] border border-[#D8E3EE] bg-cover bg-center"
                        />
                      ) : (
                        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EEF6FF] text-[#0F67AE]">
                          <ImagePlus className="h-5 w-5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#334155]">
                          {editorImageFile ? editorImageFile.name : editingCard?.imageOriginalFileName ?? "Upload a card image"}
                        </span>
                        <span className="mt-1 block text-xs text-[#64748B]">
                          JPG, PNG, WebP, or GIF. This image appears on the admin card and the user micro-education card.
                        </span>
                      </span>
                    </button>
                    {editorImageFile ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditorImageFile(null);
                          if (editorImageInputRef.current) {
                            editorImageInputRef.current.value = "";
                          }
                        }}
                        className="text-xs font-semibold text-[#64748B] transition hover:text-[#0F67AE]"
                      >
                        Clear selected image
                      </button>
                    ) : null}
                  </div>
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Category</span>
                    <select
                      value={editorValues.categoryId ?? ""}
                      onChange={event => setEditorValue("categoryId", event.target.value)}
                      className="h-10 w-full rounded-[6px] border border-[#D5DEE7] px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#4BA3D9]"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                          {category.status === "draft" ? " (Draft)" : ""}
                        </option>
                      ))}
                    </select>
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
                  <label className="space-y-1.5">
                    <span className="text-sm font-semibold text-[#334155]">Views</span>
                    <input
                      type="number"
                      min={0}
                      value={editorValues.views ?? 0}
                      onChange={event => setEditorValue("views", Number.parseInt(event.target.value, 10) || 0)}
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

                <div className="flex items-center justify-between border-t border-[#E5EAF1] bg-white px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={closeEditorModal}
                    className="rounded-[6px] px-3 py-2 text-sm font-semibold text-[#334155] transition hover:bg-[#F3F7FB] hover:text-[#1E293B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveEditorValues()}
                    disabled={isSaving}
                    className="inline-flex h-10 min-w-28 items-center justify-center rounded-[6px] bg-[#01579B] px-5 text-sm font-semibold text-white transition enabled:hover:bg-[#0B4A80] disabled:cursor-not-allowed disabled:bg-[#9FB9D1]"
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
