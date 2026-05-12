import { FileUp, Plus, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  KnowledgeSourceItem,
  KnowledgeSourceJurisdiction,
  KnowledgeSourceMetadata,
  KnowledgeSourceTopic,
  KnowledgeSourceType,
} from "@/lib/knowledge-sources";

import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { getAdminAuthSession } from "@/lib/admin-auth";
import {
  approveKnowledgeSource,
  createKnowledgeSource,
  deleteKnowledgeSource,
  getKnowledgeSourceId,
  ingestKnowledgeSource,
  listKnowledgeSources,
  reindexKnowledgeSource,
  rejectKnowledgeSource,
  updateKnowledgeSource,
} from "@/lib/knowledge-sources";

const TEMPLATE_TABS = [
  {
    id: "riskPhrasing",
    label: "Risk Phrasing",
    value: `Based on recent reports of {Scam_Type}, we have identified a high probability of fraudulent activity.\n\nThis pattern typically involves long-term emotional manipulation followed by requests for cryptocurrency transfers.\n\nRecommendation: Cease all communication immediately. Do not transfer any funds. The platform advises users to report this profile.`,
  },
  {
    id: "disclaimerPhrasing",
    label: "Disclaimer Phrasing",
    value: `SafeSpeak provides guidance and referral support, not legal advice.\n\nBefore sharing information with a partner organization, confirm the user's consent status and review any jurisdiction-specific requirements.\n\nUse plain, non-judgmental language in every explanation.`,
  },
  {
    id: "generalResponses",
    label: "General Responses",
    value: `Acknowledge the user's experience, summarise the immediate safety steps, and provide the next best support option.\n\nWhen confidence is low, route the draft to human review before publishing or sharing externally.`,
  },
] as const;

type TemplateTabId = (typeof TEMPLATE_TABS)[number]["id"];

const CATEGORY_OPTIONS = ["Legislation", "Scam Pattern", "Regulation"] as const;

type CreateSourceFormState = {
  title: string;
  adminCategory: (typeof CATEGORY_OPTIONS)[number];
  description: string;
  publisher: string;
  url: string;
  jurisdiction: KnowledgeSourceJurisdiction;
  topic: KnowledgeSourceTopic;
  sourceType: KnowledgeSourceType;
  legalReviewed: boolean;
  ingestImmediately: boolean;
  rawContent: string;
  localFilePath: string;
  constitutionalBasis: string;
  legislationTags: string;
};

const DEFAULT_CREATE_FORM: CreateSourceFormState = {
  title: "",
  adminCategory: "Regulation",
  description: "",
  publisher: "SafeSpeak Content Team",
  url: "",
  jurisdiction: "AU",
  topic: "online_safety",
  sourceType: "Policy",
  legalReviewed: false,
  ingestImmediately: true,
  rawContent: "",
  localFilePath: "",
  constitutionalBasis: "",
  legislationTags: "",
};

function getFriendlyError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (/jwt expired|token|authentication/i.test(error.message)) {
    return "Admin session expired. Please login again, then retry.";
  }

  return error.message;
}

function categoryClass(category: string) {
  if (category === "Legislation") {
    return "bg-[#E5ECFF] text-[#3B5BCC]";
  }
  if (category === "Scam Pattern") {
    return "bg-[#FFE8EA] text-[#D14343]";
  }
  return "bg-[#EFE3FF] text-[#7C3AED]";
}

function ingestionClass(status: string) {
  if (status === "Ingested" || status === "Approved") {
    return "bg-[#DCFCE7] text-[#0F7A43]";
  }
  if (status === "Rejected" || status === "Expired" || status === "Archived") {
    return "bg-[#FEE2E2] text-[#B42318]";
  }
  return "bg-[#FFF0D9] text-[#B45309]";
}

function getMetadata(source?: KnowledgeSourceItem): KnowledgeSourceMetadata {
  return source?.metadata ?? {};
}

function displayCategory(source: KnowledgeSourceItem) {
  const metadataCategory = getMetadata(source).adminCategory;

  if (typeof metadataCategory === "string" && metadataCategory.trim()) {
    return metadataCategory;
  }

  if (source.sourceCategory === "admin_content") {
    return "Scam Pattern";
  }

  if (source.sourceType === "Regulation") {
    return "Regulation";
  }

  return "Legislation";
}

function displayStatus(source: KnowledgeSourceItem) {
  const labels: Record<KnowledgeSourceItem["status"], string> = {
    approved: "Approved",
    pending_review: "Pending Review",
    draft: "Draft",
    rejected: "Rejected",
    expired: "Expired",
    archived: "Archived",
  };

  if (source.ingestionStatus === "failed") {
    return "Ingestion Failed";
  }

  if (source.status === "approved" && !source.ingestedAt && !getMetadata(source).chunkCount) {
    return "Approved (Not Ingested)";
  }

  if (source.ingestionStatus === "embedded" || getMetadata(source).chunkCount) {
    return "Approved";
  }

  return labels[source.status];
}

function formatSourceAge(source: KnowledgeSourceItem) {
  const value = source.ingestedAt ?? source.updatedAt ?? source.createdAt;

  if (!value) {
    return "Unknown";
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  const diffMs = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    return `${Math.max(1, Math.round(diffMs / minute))} mins ago`;
  }

  if (diffMs < day) {
    return `${Math.round(diffMs / hour)} hour${Math.round(diffMs / hour) === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(time));
}

function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function buildSourceMetadata(form: CreateSourceFormState): KnowledgeSourceMetadata {
  return {
    adminCategory: form.adminCategory,
    constitutionalBasis: form.constitutionalBasis.trim() || undefined,
    legislationTags: parseCommaSeparatedValues(form.legislationTags),
    templates: Object.fromEntries(TEMPLATE_TABS.map(tab => [tab.id, tab.value])),
  };
}

function getTemplateValue(source: KnowledgeSourceItem | undefined, tabId: TemplateTabId) {
  const templateValue = getMetadata(source).templates?.[tabId];

  if (typeof templateValue === "string") {
    return templateValue;
  }

  return TEMPLATE_TABS.find(tab => tab.id === tabId)?.value ?? "";
}

function upsertSource(
  sources: KnowledgeSourceItem[],
  updatedSource: KnowledgeSourceItem,
): KnowledgeSourceItem[] {
  const updatedId = getKnowledgeSourceId(updatedSource);

  if (!updatedId) {
    return sources;
  }

  const exists = sources.some(source => getKnowledgeSourceId(source) === updatedId);

  if (!exists) {
    return [updatedSource, ...sources];
  }

  return sources.map(source => getKnowledgeSourceId(source) === updatedId ? updatedSource : source);
}

function getActorRefId(value: KnowledgeSourceItem["createdBy"]): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id ?? value._id ?? "";
}

function getCurrentAdminId(): string {
  const session = getAdminAuthSession();

  return session?.user.id ?? session?.user._id ?? "";
}

export function AdminContentKnowledgeSourcesPage() {
  const [sources, setSources] = useState<KnowledgeSourceItem[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateTabId>(TEMPLATE_TABS[0].id);
  const [templateDraft, setTemplateDraft] = useState<string>(TEMPLATE_TABS[0].value);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSourceFormState>(DEFAULT_CREATE_FORM);
  const [statusMessage, setStatusMessage] = useState<string | null>("Loading knowledge sources...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const currentAdminId = useMemo(() => getCurrentAdminId(), []);

  const isOwnSource = useCallback(
    (source: KnowledgeSourceItem | undefined) => {
      const creatorId = getActorRefId(source?.createdBy);

      return Boolean(currentAdminId && creatorId && creatorId === currentAdminId);
    },
    [currentAdminId],
  );

  const loadSources = useCallback(async () => {
    setIsLoading(true);

    try {
      const items = await listKnowledgeSources();
      setSources(items);
      setSelectedSourceId(currentId => currentId || getKnowledgeSourceId(items[0] ?? {} as KnowledgeSourceItem));
      setStatusMessage(items.length > 0 ? "Knowledge-source workflows are active." : "No knowledge sources found.");
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not load knowledge sources."));
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const selectedSource = useMemo(
    () => sources.find(source => getKnowledgeSourceId(source) === selectedSourceId) ?? sources[0],
    [selectedSourceId, sources],
  );
  const selectedSourceMetadata = useMemo(
    () => getMetadata(selectedSource),
    [selectedSource],
  );

  useEffect(() => {
    setTemplateDraft(getTemplateValue(selectedSource, activeTemplateTab));
  }, [activeTemplateTab, selectedSource]);

  const saveTemplate = async (publish: boolean) => {
    if (!selectedSource) {
      setStatusMessage("Select a source before saving.");
      return;
    }

    const sourceId = getKnowledgeSourceId(selectedSource);

    if (!sourceId) {
      setStatusMessage("Selected source is missing an id.");
      return;
    }

    if (publish && selectedSource.status !== "approved" && isOwnSource(selectedSource)) {
      setStatusMessage("This source needs approval from a different admin.");
      return;
    }

    setIsSaving(true);

    try {
      const metadata = getMetadata(selectedSource);
      const templates = {
        ...metadata.templates,
        [activeTemplateTab]: templateDraft,
      };
      const updated = await updateKnowledgeSource(sourceId, {
        metadata: {
          ...metadata,
          templates,
        },
      });
      const finalSource = publish && updated.status !== "approved"
        ? await approveKnowledgeSource(sourceId)
        : updated;

      setSources(currentSources => upsertSource(currentSources, finalSource));
      setStatusMessage(
        publish
          ? `Published ${TEMPLATE_TABS.find(tab => tab.id === activeTemplateTab)?.label.toLowerCase()} for ${finalSource.title}.`
          : `Draft saved for ${finalSource.title}.`,
      );
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not save template."));
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleCreateSource = async () => {
    const title = createForm.title.trim();

    if (!title) {
      setStatusMessage("Source name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const isScamPattern = createForm.adminCategory === "Scam Pattern";
      const isRegulation = createForm.adminCategory === "Regulation";
      const metadata = buildSourceMetadata(createForm);
      const created = await createKnowledgeSource({
        title,
        description: createForm.description.trim() || "Admin-created source awaiting review.",
        sourceCategory: isScamPattern ? "admin_content" : "official_legal_source",
        jurisdiction: isScamPattern ? "Global" : createForm.jurisdiction,
        topic: isScamPattern ? "scam" : createForm.topic,
        sourceType: isScamPattern ? "Report" : isRegulation ? "Regulation" : createForm.sourceType,
        language: "en",
        url: createForm.url.trim() || undefined,
        publisher: createForm.publisher.trim() || "SafeSpeak Content Team",
        licenseStatus: "Internal use",
        legalReviewed: createForm.legalReviewed,
        status: "pending_review",
        version: 1,
        metadata,
      });

      let finalSource = created;
      const createdId = getKnowledgeSourceId(created);

      if (createForm.ingestImmediately && createdId && (createForm.rawContent.trim() || createForm.localFilePath.trim())) {
        const ingestResult = await ingestKnowledgeSource(createdId, {
          content: createForm.rawContent.trim() || undefined,
          localFilePath: createForm.localFilePath.trim() || undefined,
          metadata,
        });
        finalSource = ingestResult.source ?? created;
      }

      setSources(currentSources => upsertSource(currentSources, finalSource));
      setSelectedSourceId(getKnowledgeSourceId(finalSource));
      setIsCreateOpen(false);
      setCreateForm(DEFAULT_CREATE_FORM);
      setStatusMessage(
        createForm.ingestImmediately
          ? "New source added and ingestion started."
          : "New source added to the review queue.",
      );
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not add source."));
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setCreateForm(current => ({
        ...current,
        rawContent: text,
      }));
      setStatusMessage(`Loaded ${file.name} into the ingestion editor.`);
    }
    catch {
      setStatusMessage("Could not read the selected file.");
    }
  };

  const handleIngestSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    if (!source.rawText && !source.localFilePath) {
      setStatusMessage("This source has no stored raw text or file path to ingest.");
      return;
    }

    try {
      const result = await ingestKnowledgeSource(sourceId, {
        content: source.rawText,
        localFilePath: source.localFilePath,
        metadata: source.metadata,
      });
      const nextSource = result.source ?? source;
      setSources(currentSources => upsertSource(currentSources, nextSource));
      setStatusMessage(
        `${nextSource.title} ingested with ${result.chunkCount ?? 0} chunk${result.chunkCount === 1 ? "" : "s"}.`,
      );
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not ingest source."));
    }
  };

  const handleReindexSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    try {
      const result = await reindexKnowledgeSource(sourceId);
      const nextSource = result.source ?? source;
      setSources(currentSources => upsertSource(currentSources, nextSource));
      setStatusMessage(
        `${nextSource.title} reindexed with ${result.chunkCount ?? 0} chunk${result.chunkCount === 1 ? "" : "s"}.`,
      );
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not reindex source."));
    }
  };

  const toggleLegalReview = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    try {
      const updated = await updateKnowledgeSource(sourceId, {
        legalReviewed: !source.legalReviewed,
      });
      setSources(currentSources => upsertSource(currentSources, updated));
      setStatusMessage(
        `${updated.title} legal review ${updated.legalReviewed ? "enabled" : "removed"}.`,
      );
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not update legal-review flag."));
    }
  };

  const handleRejectSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    try {
      const rejected = await rejectKnowledgeSource(sourceId, "Rejected from the admin knowledge-source queue.");
      setSources(currentSources => upsertSource(currentSources, rejected));
      setStatusMessage(`${rejected.title} marked as rejected.`);
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not reject source."));
    }
  };

  const handleDeleteSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    try {
      await deleteKnowledgeSource(sourceId);
      setSources(currentSources => currentSources.filter(item => getKnowledgeSourceId(item) !== sourceId));
      setSelectedSourceId(currentId => currentId === sourceId ? "" : currentId);
      setStatusMessage(`${source.title} deleted.`);
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not delete source."));
    }
  };

  return (
    <AdminContentManagementShell>
      <section className="w-full min-w-0 space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#1E293B]">Recent Knowledge Sources</p>
            {statusMessage
              ? <p className="mt-1 text-[12px] font-medium text-[#0F67AE]">{statusMessage}</p>
              : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void loadSources()}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E3EE] bg-white px-3 text-[11px] font-semibold text-[#334155] transition hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-3 w-3" />
              Re-scan Sources
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsCreateOpen(true);
                setStatusMessage("Fill in the new knowledge source details.");
              }}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#F59E0B] px-3 text-[11px] font-semibold text-white transition hover:bg-[#D88B07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-3 w-3" />
              Add New Source
            </button>
          </div>
        </div>

        {isCreateOpen
          ? (
              <section className="rounded-[10px] border border-[#D8E3EE] bg-[#FAFCFF] p-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_180px]">
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Source Name</p>
                      <input
                        type="text"
                        value={createForm.title}
                        onChange={event => setCreateForm(current => ({ ...current, title: event.target.value }))}
                        placeholder="Community Safety Bulletin"
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Category</p>
                      <select
                        value={createForm.adminCategory}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            adminCategory: event.target.value as CreateSourceFormState["adminCategory"],
                          }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      >
                        {CATEGORY_OPTIONS.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Publisher</p>
                      <input
                        type="text"
                        value={createForm.publisher}
                        onChange={event => setCreateForm(current => ({ ...current, publisher: event.target.value }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Jurisdiction</p>
                      <select
                        value={createForm.jurisdiction}
                        onChange={event => setCreateForm(current => ({
                          ...current,
                          jurisdiction: event.target.value as KnowledgeSourceJurisdiction,
                        }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      >
                        {["Cth", "NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT", "AU", "Global", "Internal"].map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Topic</p>
                      <select
                        value={createForm.topic}
                        onChange={event => setCreateForm(current => ({
                          ...current,
                          topic: event.target.value as KnowledgeSourceTopic,
                        }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      >
                        {["discrimination", "racial_hatred", "online_safety", "scam", "privacy", "workplace", "dv", "evidence", "support", "safespeak_policy", "consent", "crisis", "education", "other"].map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Source Type</p>
                      <select
                        value={createForm.sourceType}
                        onChange={event => setCreateForm(current => ({
                          ...current,
                          sourceType: event.target.value as KnowledgeSourceType,
                        }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      >
                        {["Act", "Regulation", "Guideline", "Form", "Decision", "Report", "Policy", "ProductRequirement", "SupportResource", "FAQ", "WebPage"].map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Source URL</p>
                      <input
                        type="url"
                        value={createForm.url}
                        onChange={event => setCreateForm(current => ({ ...current, url: event.target.value }))}
                        placeholder="https://example.org/source"
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                  </div>

                  <label className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Description</p>
                    <textarea
                      rows={3}
                      value={createForm.description}
                      onChange={event => setCreateForm(current => ({ ...current, description: event.target.value }))}
                      placeholder="Short note about what this source controls."
                      className="w-full resize-none rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                    />
                  </label>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Constitutional / Legal Basis</p>
                      <input
                        type="text"
                        value={createForm.constitutionalBasis}
                        onChange={event => setCreateForm(current => ({ ...current, constitutionalBasis: event.target.value }))}
                        placeholder="Australian Constitution, Anti-Discrimination Act"
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Legislation Tags</p>
                      <input
                        type="text"
                        value={createForm.legislationTags}
                        onChange={event => setCreateForm(current => ({ ...current, legislationTags: event.target.value }))}
                        placeholder="racial hatred, vilification, discrimination"
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                  </div>

                  <label className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Resource Text For AI Ingestion</p>
                    <textarea
                      rows={8}
                      value={createForm.rawContent}
                      onChange={event => setCreateForm(current => ({ ...current, rawContent: event.target.value }))}
                      placeholder="Paste legislation, policy, guidance, or support content here."
                      className="w-full resize-none rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                    />
                  </label>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Local File Path</p>
                      <input
                        type="text"
                        value={createForm.localFilePath}
                        onChange={event => setCreateForm(current => ({ ...current, localFilePath: event.target.value }))}
                        placeholder="D:\\docs\\policy.txt"
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Upload File</p>
                      <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] transition hover:bg-[#F8FBFF]">
                        <FileUp className="h-4 w-4" />
                        Load File Into Text
                        <input
                          type="file"
                          accept=".txt,.md,.html,.csv,.json"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            void handleFileUpload(file);
                          }}
                        />
                      </label>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-[12px] text-[#334155]">
                      <input
                        type="checkbox"
                        checked={createForm.legalReviewed}
                        onChange={event => setCreateForm(current => ({ ...current, legalReviewed: event.target.checked }))}
                      />
                      Mark as legally reviewed
                    </label>
                    <label className="inline-flex items-center gap-2 text-[12px] text-[#334155]">
                      <input
                        type="checkbox"
                        checked={createForm.ingestImmediately}
                        onChange={event => setCreateForm(current => ({ ...current, ingestImmediately: event.target.checked }))}
                      />
                      Ingest immediately after create
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setCreateForm(DEFAULT_CREATE_FORM);
                        setStatusMessage("New source cancelled.");
                      }}
                      className="h-8 rounded-md px-3 text-xs font-semibold text-[#64748B] transition hover:bg-[#F3F7FB]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleCreateSource()}
                      className="h-8 rounded-md bg-[#0F67AE] px-4 text-xs font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Creating..." : "Create Source"}
                    </button>
                  </div>
                </div>
              </section>
            )
          : null}

        <div className="overflow-x-auto rounded-[10px] border border-[#D5DEE7]">
          <table className="w-full min-w-full border-collapse text-left lg:min-w-[760px]">
            <thead className="bg-[#F8FBFF]">
              <tr className="text-[10px] uppercase tracking-wide text-[#607B90]">
                <th className="px-3 py-2 font-semibold">Source Name</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Date Added</th>
                <th className="px-3 py-2 font-semibold">Ingestion Status</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-[#607B90]">
                        Loading knowledge sources...
                      </td>
                    </tr>
                  )
                : null}
              {!isLoading && sources.length === 0
                ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-[#607B90]">
                        No knowledge sources have been added yet.
                      </td>
                    </tr>
                  )
                : null}
              {sources.map((row) => {
                const sourceId = getKnowledgeSourceId(row);
                const category = displayCategory(row);
                const status = displayStatus(row);
                const cannotApproveOwnSource = row.status !== "approved" && isOwnSource(row);
                return (
                  <tr
                    key={sourceId}
                    className="cursor-pointer border-t border-[#E4EAF1] text-[12px] text-[#1E293B] transition hover:bg-[#F8FBFF]"
                    onClick={() => {
                      setSelectedSourceId(sourceId);
                      setStatusMessage(`Editing templates for ${row.title}.`);
                    }}
                  >
                    <td className="px-3 py-2.5 font-medium">{row.title}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryClass(category)}`}>{category}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[#607B90]">{formatSourceAge(row)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ingestionClass(status)}`}>{status}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleIngestSource(row);
                          }}
                          className="rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                        >
                          Ingest
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleReindexSource(row);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reindex
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void toggleLegalReview(row);
                          }}
                          className="rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                        >
                          {row.legalReviewed ? "Legal OK" : "Mark Legal"}
                        </button>
                        {row.status !== "approved"
                          ? (
                              <button
                                type="button"
                                disabled={cannotApproveOwnSource}
                                title={cannotApproveOwnSource ? "A different admin must approve this source." : undefined}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (cannotApproveOwnSource) {
                                    setStatusMessage("This source needs approval from a different admin.");
                                    return;
                                  }
                                  void approveKnowledgeSource(sourceId).then((approvedSource) => {
                                    setSources(currentSources => upsertSource(currentSources, approvedSource));
                                    setStatusMessage(`${approvedSource.title} approved.`);
                                  }).catch((error: unknown) => {
                                    setStatusMessage(getFriendlyError(error, "Could not approve source."));
                                  });
                                }}
                                className="rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )
                          : null}
                        {row.status !== "rejected"
                          ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleRejectSource(row);
                                }}
                                className="rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#B45309] transition hover:bg-[#FFF7ED]"
                              >
                                Reject
                              </button>
                            )
                          : null}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteSource(row);
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-[#B42318] transition hover:bg-[#FFF5F5]"
                          aria-label={`Delete ${row.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className="rounded-[10px] border border-[#D8E3EE]">
          <div className="border-b border-[#E4EAF1] px-3 py-2">
            <h3 className="text-sm font-semibold text-[#1E293B]">Explanation Template Editor</h3>
            <p className="mt-0.5 text-[11px] text-[#607B90]">
              Editing response for:
              {" "}
              <span className="font-medium text-[#0F67AE]">{selectedSource?.title ?? "No source selected"}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {TEMPLATE_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTemplateTab(tab.id)}
                  className={tab.id === activeTemplateTab
                    ? "rounded border border-[#0F67AE] bg-[#EEF6FF] px-2 py-0.5 font-medium text-[#0F67AE]"
                    : "rounded border border-[#D8E3EE] px-2 py-0.5 text-[#607B90] transition hover:bg-[#F8FBFF]"}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-[#E4EAF1] px-3 py-2 text-[10px] text-[#607B90]">
            VARIABLES
            <span className="ml-2 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[#1D4ED8]">{`{User_Name}`}</span>
            <span className="ml-1 rounded bg-[#FFE4E6] px-1.5 py-0.5 text-[#BE123C]">{`{Scam_Type}`}</span>
            <span className="ml-1 rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[#15803D]">{`{Risk_Level}`}</span>
          </div>

          <textarea
            rows={9}
            value={templateDraft}
            onChange={event => setTemplateDraft(event.target.value)}
            disabled={!selectedSource}
            className="w-full resize-none rounded-b-[10px] bg-white px-3 py-3 text-sm leading-6 text-[#334155] outline-none disabled:text-[#94A3B8]"
          />
        </section>

        {selectedSource
          ? (
              <section className="rounded-[10px] border border-[#D8E3EE] bg-[#FAFCFF] p-3">
                <h3 className="text-sm font-semibold text-[#1E293B]">Detected Legal Metadata</h3>
                <div className="mt-2 grid gap-2 text-[12px] text-[#475569] lg:grid-cols-2">
                  <p>
                    <span className="font-semibold text-[#1E293B]">Legal reviewed:</span>
                    {" "}
                    {selectedSource.legalReviewed ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Ingestion:</span>
                    {" "}
                    {selectedSource.ingestionStatus ?? "metadata_only"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Detected type:</span>
                    {" "}
                    {typeof selectedSourceMetadata.detectedLegalType === "string"
                      ? selectedSourceMetadata.detectedLegalType
                      : "Not detected"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Chunk count:</span>
                    {" "}
                    {typeof selectedSourceMetadata.chunkCount === "number"
                      ? selectedSourceMetadata.chunkCount
                      : 0}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">Acts / instruments:</span>
                    {" "}
                    {Array.isArray(selectedSourceMetadata.detectedActNames) && selectedSourceMetadata.detectedActNames.length
                      ? selectedSourceMetadata.detectedActNames.join(", ")
                      : "None detected"}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">Sections / articles:</span>
                    {" "}
                    {Array.isArray(selectedSourceMetadata.detectedSectionRefs) && selectedSourceMetadata.detectedSectionRefs.length
                      ? selectedSourceMetadata.detectedSectionRefs.join(", ")
                      : "None detected"}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">Constitutional mentions:</span>
                    {" "}
                    {Array.isArray(selectedSourceMetadata.detectedConstitutionalMentions) && selectedSourceMetadata.detectedConstitutionalMentions.length
                      ? selectedSourceMetadata.detectedConstitutionalMentions.join(", ")
                      : "None detected"}
                  </p>
                  {selectedSource.ingestionError
                    ? (
                        <p className="lg:col-span-2 text-[#B42318]">
                          <span className="font-semibold">Ingestion error:</span>
                          {" "}
                          {selectedSource.ingestionError}
                        </p>
                      )
                    : null}
                </div>
              </section>
            )
          : null}

        <div className="flex flex-col gap-2 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#94A3B8]">
            {selectedSource?.updatedAt ? `Last synced ${formatSourceAge(selectedSource)}` : "Select a source to edit templates"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!selectedSource || isSaving}
              onClick={() => void saveTemplate(false)}
              className="inline-flex h-8 items-center rounded-md border border-[#D8E3EE] bg-white px-3 font-semibold text-[#334155] transition hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={!selectedSource || isSaving}
              onClick={() => void saveTemplate(true)}
              className="inline-flex h-8 items-center rounded-md bg-[#F59E0B] px-3 font-semibold text-white transition hover:bg-[#D88B07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Publish Update
            </button>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
