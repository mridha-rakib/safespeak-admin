import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Plus,
  RefreshCcw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  KnowledgeSourceCategory,
  KnowledgeSourceChunkPreview,
  KnowledgeSourceInput,
  KnowledgeSourceItem,
  KnowledgeSourceJurisdiction,
  KnowledgeSourceMetadata,
  KnowledgeSourceReadiness,
  KnowledgeSourceTopic,
  KnowledgeSourceType,
} from "@/lib/knowledge-sources";

import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import {
  approveKnowledgeSource,
  createKnowledgeSource,
  deleteKnowledgeSource,
  getKnowledgeSourceReadiness,
  getKnowledgeSourceId,
  ingestKnowledgeSource,
  listKnowledgeSourceChunks,
  listKnowledgeSources,
  refreshKnowledgeSource,
  reindexKnowledgeSource,
  rejectKnowledgeSource,
  updateKnowledgeSource,
  uploadKnowledgeSourceDocument,
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

const CATEGORY_OPTIONS = [
  "Legislation",
  "Support",
  "Scam Pattern",
  "Regulation",
] as const;
const SOURCE_CATEGORY_OPTIONS: Array<{
  value: KnowledgeSourceCategory;
  label: string;
}> = [
  { value: "official_legal_source", label: "Official legal source" },
  { value: "official_support_source", label: "Official support source" },
  { value: "internal_product_rule", label: "Internal SafeSpeak rule" },
  { value: "admin_content", label: "Admin content" },
];
const JURISDICTION_OPTIONS: KnowledgeSourceJurisdiction[] = [
  "Cth",
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "NT",
  "ACT",
  "AU",
  "Global",
  "Internal",
];
const TOPIC_OPTIONS: KnowledgeSourceTopic[] = [
  "discrimination",
  "racial_hatred",
  "online_safety",
  "scam",
  "privacy",
  "workplace",
  "dv",
  "evidence",
  "support",
  "safespeak_policy",
  "consent",
  "crisis",
  "education",
  "other",
];
const SOURCE_TYPE_OPTIONS: KnowledgeSourceType[] = [
  "Act",
  "Regulation",
  "Guideline",
  "Form",
  "Decision",
  "Report",
  "Policy",
  "ProductRequirement",
  "SupportResource",
  "FAQ",
  "WebPage",
];
const LICENSE_STATUS_OPTIONS = [
  "Government copyright",
  "Public domain",
  "CC BY",
  "CC BY-SA",
  "Agency permission required",
  "Internal use",
] as const;

type CreateSourceFormState = {
  title: string;
  adminCategory: (typeof CATEGORY_OPTIONS)[number];
  description: string;
  sourceCategory: KnowledgeSourceCategory;
  publisher: string;
  licenseStatus: string;
  url: string;
  jurisdiction: KnowledgeSourceJurisdiction;
  topic: KnowledgeSourceTopic;
  sourceType: KnowledgeSourceType;
  lastUpdated: string;
  nextRefreshAt: string;
  nextReviewAt: string;
  reviewNotes: string;
  legalReviewed: boolean;
  ingestImmediately: boolean;
  rawContent: string;
  documentFile: File | null;
  constitutionalBasis: string;
  legislationTags: string;
};

type CreateSourceValidationErrors = Partial<
  Record<
    | "title"
    | "sourceCategory"
    | "publisher"
    | "licenseStatus"
    | "url"
    | "lastUpdated"
    | "nextRefreshAt"
    | "sourceType"
    | "document",
    string
  >
>;

type DocumentUploadStatus =
  | "idle"
  | "selected"
  | "uploading"
  | "extracting"
  | "indexed"
  | "failed"
  | "needs_review";

type GovernanceDraft = Pick<
  KnowledgeSourceInput,
  | "title"
  | "description"
  | "sourceCategory"
  | "jurisdiction"
  | "topic"
  | "sourceType"
  | "language"
  | "url"
  | "localFilePath"
  | "publisher"
  | "licenseStatus"
  | "lastUpdated"
  | "nextReviewAt"
  | "nextRefreshAt"
  | "legalReviewed"
  | "reviewNotes"
>;

function toDateInputValue(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function addDaysInputValue(value: string, days: number): string {
  const date = value ? new Date(`${value}T00:00:00.000Z`) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function createDefaultCreateForm(): CreateSourceFormState {
  const lastUpdated = todayInputValue();

  return {
    title: "",
    adminCategory: "Regulation",
    description: "",
    sourceCategory: "official_legal_source",
    publisher: "Australian Government",
    licenseStatus: "Government copyright",
    url: "",
    jurisdiction: "AU",
    topic: "discrimination",
    sourceType: "Act",
    lastUpdated,
    nextRefreshAt: addDaysInputValue(lastUpdated, 90),
    nextReviewAt: "",
    reviewNotes: "",
    legalReviewed: false,
    ingestImmediately: true,
    rawContent: "",
    documentFile: null,
    constitutionalBasis: "",
    legislationTags: "",
  };
}

function getFriendlyError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (/jwt expired|token|authentication/i.test(error.message)) {
    return "Admin session expired. Please login again, then retry.";
  }

  return error.message;
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getFileLabel(file: File | null) {
  if (!file) {
    return "";
  }

  return `${file.name} · ${formatFileSize(file.size)} · ${file.type || "unknown type"}`;
}

function validateCreateSourceForm(
  form: CreateSourceFormState,
): CreateSourceValidationErrors {
  const errors: CreateSourceValidationErrors = {};
  const isOfficial = form.sourceCategory.startsWith("official_");

  if (!form.title.trim()) {
    errors.title = "Source name is required.";
  }
  if (!form.sourceCategory) {
    errors.sourceCategory = "Source category is required.";
  }
  if (!form.sourceType) {
    errors.sourceType = "Source type is required.";
  }
  if (!form.publisher.trim()) {
    errors.publisher = "Publisher is required.";
  }
  if (!form.licenseStatus.trim()) {
    errors.licenseStatus = "License status is required.";
  }
  if (isOfficial && !form.url.trim()) {
    errors.url = "Official legal/support sources require an authoritative URL.";
  }
  if (isOfficial && !form.lastUpdated) {
    errors.lastUpdated = "Official sources require a last-updated date.";
  }
  if (isOfficial && !form.nextRefreshAt) {
    errors.nextRefreshAt = "Official sources require a refresh date.";
  }
  if (
    form.ingestImmediately
    && !form.documentFile
    && !form.rawContent.trim()
  ) {
    errors.document = "Add a document or paste source text before immediate ingestion.";
  }

  return errors;
}

function hasValidationErrors(errors: CreateSourceValidationErrors) {
  return Object.values(errors).some(Boolean);
}

function fieldBorder(error?: string) {
  return error
    ? "border-[#D14343] focus:border-[#D14343]"
    : "border-[#D8E3EE] focus:border-[#0F67AE]";
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-[11px] font-medium text-[#B42318]">{message}</p>;
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
  if (status === "Approved For RAG" || status === "Ready For Approval") {
    return "bg-[#DCFCE7] text-[#0F7A43]";
  }
  if (status === "Rejected" || status === "Expired" || status === "Archived") {
    return "bg-[#FEE2E2] text-[#B42318]";
  }
  if (status === "Needs Refresh" || status === "Needs Legal Review") {
    return "bg-[#FFE8EA] text-[#B42318]";
  }
  return "bg-[#FFF0D9] text-[#B45309]";
}

function getMetadata(source?: KnowledgeSourceItem): KnowledgeSourceMetadata {
  return source?.metadata ?? {};
}

function isOfficialSource(source: KnowledgeSourceItem) {
  return source.sourceCategory.startsWith("official_");
}

function getChunkCount(source: KnowledgeSourceItem) {
  const chunkCount = getMetadata(source).chunkCount;

  return typeof chunkCount === "number" ? chunkCount : 0;
}

function isLegalRagSource(source: KnowledgeSourceItem) {
  return (
    source.sourceCategory === "official_legal_source"
    || source.sourceType === "Act"
    || source.sourceType === "Regulation"
  );
}

function getAdminIngestionStatus(source: KnowledgeSourceItem) {
  const metadata = getMetadata(source);
  const pipelineStatus = metadata.ingestionPipeline?.status;
  const chunkCount = getChunkCount(source);

  if (source.deletedAt || source.status === "archived" || source.status === "expired") {
    return "needs_review";
  }
  if (source.ingestionStatus === "failed" || pipelineStatus === "failed") {
    return "failed";
  }
  if (source.ingestionStatus === "embedded" && chunkCount > 0) {
    return "indexed";
  }
  if (pipelineStatus === "extracting") {
    return "extracting";
  }
  if (source.ingestionStatus === "chunked") {
    return "chunking";
  }
  if (source.ingestionStatus === "fetched") {
    return "pending";
  }
  if (source.ingestionStatus === "metadata_only" || pipelineStatus === "needs_review") {
    return "needs_review";
  }
  if (!source.ingestionStatus) {
    return "not_started";
  }

  return "pending";
}

function getEmbeddingStatus(source: KnowledgeSourceItem) {
  if (getAdminIngestionStatus(source) === "indexed") {
    return "Indexed";
  }
  if (source.ingestionStatus === "failed") {
    return "Failed";
  }
  if (getChunkCount(source) > 0) {
    return "Chunks available";
  }

  return "Not indexed";
}

function isRefreshDue(source: KnowledgeSourceItem) {
  if (!isOfficialSource(source)) {
    return false;
  }

  if (!source.nextRefreshAt) {
    return true;
  }

  const time = new Date(source.nextRefreshAt).getTime();

  return Number.isNaN(time) || time <= Date.now();
}

function isReviewDue(source: KnowledgeSourceItem) {
  if (!source.nextReviewAt) {
    return false;
  }

  const time = new Date(source.nextReviewAt).getTime();

  return Number.isNaN(time) || time <= Date.now();
}

function isExcludedFromRag(source: KnowledgeSourceItem) {
  return getRagEligibilityReasons(source).length > 0;
}

function getRagEligibilityChecks(source: KnowledgeSourceItem) {
  const hasChunks = source.ingestionStatus === "embedded" && getChunkCount(source) > 0;
  const legalReviewSatisfied =
    source.sourceCategory !== "official_legal_source" || source.legalReviewed;
  const refreshCurrent = !isOfficialSource(source) || !isRefreshDue(source);
  const reviewCurrent = !isReviewDue(source);
  const legalCategory = isLegalRagSource(source);
  const indexed = getAdminIngestionStatus(source) === "indexed";

  return [
    {
      label: "Source approved",
      passed: source.status === "approved",
      nextStep: "Click Save & Approve for RAG after registry details are complete.",
    },
    {
      label: "Indexed chunks available",
      passed: indexed && hasChunks,
      nextStep: "Upload and ingest a document, then re-index so searchable chunks are created.",
    },
    {
      label: "Legal review complete",
      passed: legalReviewSatisfied,
      nextStep: "Mark legal review complete and save registry details.",
    },
    {
      label: "Refresh date current",
      passed: refreshCurrent,
      nextStep: "Set a future refresh date or refresh the source.",
    },
    {
      label: "Review date current",
      passed: reviewCurrent,
      nextStep: "Set a future review date or clear the expired review due date.",
    },
    {
      label: "Legal source category",
      passed: legalCategory,
      nextStep: "Use Official legal source with Act or Regulation for legal RAG eligibility.",
    },
  ];
}

function getRagEligibilityReasons(source: KnowledgeSourceItem) {
  const reasons: string[] = [];

  if (source.deletedAt || source.status === "archived" || source.status === "expired") {
    reasons.push("Source archived");
  }
  if (source.status !== "approved") {
    reasons.push("Not approved yet");
  }
  if (!source.legalReviewed) {
    reasons.push("Legal review incomplete");
  }
  if (source.ingestionStatus === "failed") {
    reasons.push(source.ingestionError || "PDF extraction failed");
  }
  if (getAdminIngestionStatus(source) !== "indexed") {
    reasons.push("No indexed chunks available");
  }
  if (getChunkCount(source) <= 0) {
    reasons.push("No indexed chunks available");
  }
  if (!isLegalRagSource(source)) {
    reasons.push("Source category is not legal");
  }
  if (isOfficialSource(source) && isRefreshDue(source)) {
    reasons.push("Source refresh is due");
  }
  if (isReviewDue(source)) {
    reasons.push("Review date is due");
  }

  return Array.from(new Set(reasons));
}

function getRagNextStep(source: KnowledgeSourceItem) {
  return (
    getRagEligibilityChecks(source).find(check => !check.passed)?.nextStep
    ?? "Eligible for frontend RAG citations. This uses retrieval, not model training."
  );
}

function getApprovalBlockReason(source: KnowledgeSourceItem) {
  if (source.status === "approved") {
    return "Already approved.";
  }
  if (source.status === "archived" || source.status === "expired") {
    return "Archived sources cannot be approved.";
  }
  if (!source.title.trim()) {
    return "Title is required.";
  }
  if (!source.publisher.trim()) {
    return "Publisher is required.";
  }
  if (!source.licenseStatus.trim()) {
    return "License status is required.";
  }
  if (isOfficialSource(source) && !source.url?.trim()) {
    return "Official sources require an authoritative URL.";
  }
  if (isOfficialSource(source) && !source.lastUpdated) {
    return "Official sources require last-updated metadata.";
  }
  if (isOfficialSource(source) && !source.nextRefreshAt) {
    return "Official sources require a future refresh date.";
  }
  if (source.sourceCategory === "official_legal_source" && !source.legalReviewed) {
    return "Legal review must be complete before approval.";
  }
  if (source.ingestionStatus === "failed") {
    return "Fix failed extraction or indexing before approval.";
  }

  return "";
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

  if (getAdminIngestionStatus(source) === "failed") {
    return "Ingestion Failed";
  }

  if (
    source.status === "rejected"
    || source.status === "expired"
    || source.status === "archived"
  ) {
    return labels[source.status];
  }

  if (isOfficialSource(source) && isRefreshDue(source)) {
    return "Needs Refresh";
  }

  if (
    source.sourceCategory === "official_legal_source"
    && !source.legalReviewed
  ) {
    return "Needs Legal Review";
  }

  if (getAdminIngestionStatus(source) === "needs_review") {
    return "Needs Extracted Text";
  }

  if (source.status === "approved" && isExcludedFromRag(source)) {
    return "Approved (No Chunks)";
  }

  if (
    source.status === "approved"
    && getAdminIngestionStatus(source) === "indexed"
  ) {
    return "Approved For RAG";
  }

  if (getAdminIngestionStatus(source) === "indexed") {
    return "Ready For Approval";
  }

  return labels[source.status];
}

function displaySourceCategoryLabel(category: KnowledgeSourceCategory) {
  return (
    SOURCE_CATEGORY_OPTIONS.find(
      option => option.value === category,
    )?.label ?? category
  );
}

function displaySourceCategory(source: KnowledgeSourceItem) {
  return displaySourceCategoryLabel(source.sourceCategory);
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

function formatDate(value?: string) {
  if (!value) {
    return "Not set";
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(time));
}

function formatRefreshDue(source: KnowledgeSourceItem) {
  if (!source.nextRefreshAt) {
    return source.sourceCategory.startsWith("official_")
      ? "Required"
      : "Not required";
  }

  const time = new Date(source.nextRefreshAt).getTime();

  if (Number.isNaN(time)) {
    return "Invalid date";
  }

  if (time <= Date.now()) {
    return "Refresh due";
  }

  return formatDate(source.nextRefreshAt);
}

function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function buildSourceMetadata(
  form: CreateSourceFormState,
): KnowledgeSourceMetadata {
  return {
    adminCategory: form.adminCategory,
    constitutionalBasis: form.constitutionalBasis.trim() || undefined,
    legislationTags: parseCommaSeparatedValues(form.legislationTags),
    templates: Object.fromEntries(
      TEMPLATE_TABS.map(tab => [tab.id, tab.value]),
    ),
  };
}

function getTemplateValue(
  source: KnowledgeSourceItem | undefined,
  tabId: TemplateTabId,
) {
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

  const exists = sources.some(
    source => getKnowledgeSourceId(source) === updatedId,
  );

  if (!exists) {
    return [updatedSource, ...sources];
  }

  return sources.map(source =>
    getKnowledgeSourceId(source) === updatedId ? updatedSource : source,
  );
}

function buildGovernanceDraft(
  source: KnowledgeSourceItem | undefined,
): GovernanceDraft {
  return {
    title: source?.title ?? "",
    description: source?.description ?? "",
    sourceCategory: source?.sourceCategory ?? "official_legal_source",
    jurisdiction: source?.jurisdiction ?? "AU",
    topic: source?.topic ?? "discrimination",
    sourceType: source?.sourceType ?? "Act",
    language: source?.language ?? "en",
    url: source?.url ?? "",
    localFilePath: source?.localFilePath ?? "",
    publisher: source?.publisher ?? "",
    licenseStatus: source?.licenseStatus ?? "Government copyright",
    lastUpdated: toDateInputValue(source?.lastUpdated),
    nextReviewAt: toDateInputValue(source?.nextReviewAt),
    nextRefreshAt: toDateInputValue(source?.nextRefreshAt),
    legalReviewed: source?.legalReviewed ?? false,
    reviewNotes: source?.reviewNotes ?? "",
  };
}

function compactGovernancePayload(
  draft: GovernanceDraft,
): Partial<KnowledgeSourceInput> {
  return {
    ...draft,
    description: draft.description?.trim() || undefined,
    url: draft.url?.trim() || undefined,
    localFilePath: draft.localFilePath?.trim() || undefined,
    publisher: draft.publisher?.trim() || undefined,
    licenseStatus: draft.licenseStatus?.trim() || undefined,
    lastUpdated: draft.lastUpdated || undefined,
    nextReviewAt: draft.nextReviewAt || undefined,
    nextRefreshAt: draft.nextRefreshAt || undefined,
    reviewNotes: draft.reviewNotes?.trim() || undefined,
  };
}

function displayReadinessStatus(readiness: KnowledgeSourceReadiness) {
  switch (readiness.summary.readinessStatus) {
    case "ready":
      return "Ready";
    case "ready_with_gaps":
      return "Ready With Gaps";
    default:
      return "Not Ready";
  }
}

function readinessStatusClass(readiness: KnowledgeSourceReadiness) {
  switch (readiness.summary.readinessStatus) {
    case "ready":
      return "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]";
    case "ready_with_gaps":
      return "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]";
    default:
      return "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]";
  }
}

function getPriorityCoverageGaps(readiness: KnowledgeSourceReadiness) {
  return readiness.coverage
    .filter(cell => cell.eligibleSources === 0 || cell.needsLegalReviewSources > 0 || cell.needsRefreshSources > 0)
    .sort((a, b) => {
      const aMissing = a.eligibleSources === 0 ? 1 : 0;
      const bMissing = b.eligibleSources === 0 ? 1 : 0;

      if (aMissing !== bMissing) {
        return bMissing - aMissing;
      }

      return `${a.sourceCategory}:${a.jurisdiction}:${a.topic}`.localeCompare(
        `${b.sourceCategory}:${b.jurisdiction}:${b.topic}`,
      );
    })
    .slice(0, 6);
}

export function AdminContentKnowledgeSourcesPage() {
  const [sources, setSources] = useState<KnowledgeSourceItem[]>([]);
  const [readiness, setReadiness] = useState<KnowledgeSourceReadiness | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateTabId>(
    TEMPLATE_TABS[0].id,
  );
  const [templateDraft, setTemplateDraft] = useState<string>(
    TEMPLATE_TABS[0].value,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSourceFormState>(() =>
    createDefaultCreateForm(),
  );
  const [createErrors, setCreateErrors] = useState<CreateSourceValidationErrors>({});
  const [governanceDraft, setGovernanceDraft] = useState<GovernanceDraft>(() =>
    buildGovernanceDraft(undefined),
  );
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedUploadStatus, setSelectedUploadStatus] = useState<DocumentUploadStatus>("idle");
  const [sourceChunks, setSourceChunks] = useState<KnowledgeSourceChunkPreview[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "Loading knowledge sources...",
  );
  const [templateActionMessage, setTemplateActionMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSources = useCallback(async () => {
    setIsLoading(true);

    try {
      const [items, readinessResult] = await Promise.all([
        listKnowledgeSources(),
        getKnowledgeSourceReadiness(),
      ]);

      setSources(items);
      setReadiness(readinessResult);
      setSelectedSourceId(
        currentId =>
          currentId
          || getKnowledgeSourceId(items[0] ?? ({} as KnowledgeSourceItem)),
      );
      setStatusMessage(
        items.length > 0
          ? "Knowledge-source workflows are active."
          : "No knowledge sources found.",
      );
    }
    catch (error) {
      setReadiness(null);
      setStatusMessage(
        getFriendlyError(error, "Could not load knowledge sources."),
      );
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const selectedSource = useMemo(
    () =>
      sources.find(
        source => getKnowledgeSourceId(source) === selectedSourceId,
      ) ?? sources[0],
    [selectedSourceId, sources],
  );
  const selectedSourceMetadata = useMemo(
    () => getMetadata(selectedSource),
    [selectedSource],
  );
  const priorityCoverageGaps = useMemo(
    () => (readiness ? getPriorityCoverageGaps(readiness) : []),
    [readiness],
  );
  const queueStats = useMemo(() => {
    const officialSources = sources.filter(isOfficialSource);

    return {
      needsRefresh: officialSources.filter(isRefreshDue).length,
      staleExcluded: officialSources.filter(
        source => isRefreshDue(source) && isExcludedFromRag(source),
      ).length,
      needsLegalReview: officialSources.filter(
        source =>
          source.sourceCategory === "official_legal_source"
          && !source.legalReviewed,
      ).length,
      readyForApproval: sources.filter(
        source =>
          displayStatus(source) === "Ready For Approval"
          && source.status !== "approved",
      ).length,
    };
  }, [sources]);

  useEffect(() => {
    setTemplateDraft(getTemplateValue(selectedSource, activeTemplateTab));
    setGovernanceDraft(buildGovernanceDraft(selectedSource));
    setSelectedUploadFile(null);
    setSelectedUploadStatus("idle");
    setSourceChunks([]);
  }, [activeTemplateTab, selectedSource]);

  const saveTemplate = async (publish: boolean) => {
    if (!selectedSource) {
      setStatusMessage("Select a source before saving.");
      setTemplateActionMessage({
        tone: "error",
        text: "Select a source before saving.",
      });
      return;
    }

    const sourceId = getKnowledgeSourceId(selectedSource);

    if (!sourceId) {
      setStatusMessage("Selected source is missing an id.");
      setTemplateActionMessage({
        tone: "error",
        text: "Selected source is missing an id.",
      });
      return;
    }

    setIsSaving(true);
    setTemplateActionMessage(null);

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
      const finalSource
        = publish && updated.status !== "approved"
          ? await approveKnowledgeSource(sourceId)
          : updated;

      setSources(currentSources => upsertSource(currentSources, finalSource));
      const message = publish
        ? isExcludedFromRag(finalSource)
          ? `Saved and approved ${finalSource.title}, but one RAG eligibility check still needs attention.`
          : `${finalSource.title} is approved and eligible for frontend RAG citations.`
        : `Draft saved for ${finalSource.title}.`;

      setStatusMessage(
        publish
          ? `Saved template metadata and approved ${finalSource.title} for RAG if all eligibility checks pass.`
          : `Draft saved for ${finalSource.title}.`,
      );
      setTemplateActionMessage({
        tone: "success",
        text: message,
      });
    }
    catch (error) {
      const message = getFriendlyError(error, "Could not save template.");

      setStatusMessage(message);
      setTemplateActionMessage({
        tone: "error",
        text: message,
      });
    }
    finally {
      setIsSaving(false);
    }
  };

  const saveGovernanceDetails = async () => {
    if (!selectedSource) {
      setStatusMessage("Select a source before saving registry details.");
      return;
    }

    const sourceId = getKnowledgeSourceId(selectedSource);

    if (!sourceId) {
      setStatusMessage("Selected source is missing an id.");
      return;
    }

    if (!governanceDraft.title?.trim()) {
      setStatusMessage("Source title is required.");
      return;
    }

    if (
      governanceDraft.sourceCategory?.startsWith("official_")
      && !governanceDraft.url?.trim()
    ) {
      setStatusMessage(
        "Official legal/support sources require an authoritative source URL.",
      );
      return;
    }

    if (
      governanceDraft.sourceCategory?.startsWith("official_")
      && (!governanceDraft.lastUpdated || !governanceDraft.nextRefreshAt)
    ) {
      setStatusMessage(
        "Official sources require last-updated and refresh dates.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const updated = await updateKnowledgeSource(
        sourceId,
        compactGovernancePayload(governanceDraft),
      );
      setSources(currentSources => upsertSource(currentSources, updated));
      setSelectedSourceId(getKnowledgeSourceId(updated));
      setStatusMessage(
        updated.status === "pending_review"
          ? `${updated.title} saved and returned to review.`
          : `${updated.title} registry details saved.`,
      );
    }
    catch (error) {
      setStatusMessage(
        getFriendlyError(error, "Could not save registry details."),
      );
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleCreateSource = async () => {
    const title = createForm.title.trim();
    const validationErrors = validateCreateSourceForm(createForm);

    setCreateErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      setStatusMessage("Fix the highlighted source details before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const metadata = buildSourceMetadata(createForm);
      const created = await createKnowledgeSource({
        title,
        description:
          createForm.description.trim()
          || "Admin-created source awaiting review.",
        sourceCategory: createForm.sourceCategory,
        jurisdiction: createForm.jurisdiction,
        topic: createForm.topic,
        sourceType: createForm.sourceType,
        language: "en",
        url: createForm.url.trim() || undefined,
        publisher: createForm.publisher.trim() || "SafeSpeak Content Team",
        licenseStatus:
          createForm.licenseStatus.trim() || "Government copyright",
        lastUpdated: createForm.lastUpdated || undefined,
        nextRefreshAt: createForm.nextRefreshAt || undefined,
        nextReviewAt: createForm.nextReviewAt || undefined,
        legalReviewed: createForm.legalReviewed,
        reviewNotes: createForm.reviewNotes.trim() || undefined,
        status: "pending_review",
        version: 1,
        metadata,
      });

      let finalSource = created;
      const createdId = getKnowledgeSourceId(created);

      if (createForm.documentFile && createdId) {
        setSelectedUploadStatus("uploading");
        const uploadResult = await uploadKnowledgeSourceDocument(
          createdId,
          createForm.documentFile,
          { ingestImmediately: createForm.ingestImmediately },
        );
        setSelectedUploadStatus(
          uploadResult.error
            ? "failed"
            : createForm.ingestImmediately
              ? "indexed"
              : "needs_review",
        );
        finalSource = uploadResult.source ?? created;
      }
      else
      if (
        createForm.ingestImmediately
        && createdId
        && createForm.rawContent.trim()
      ) {
        const ingestResult = await ingestKnowledgeSource(createdId, {
          content: createForm.rawContent.trim() || undefined,
          metadata,
        });
        finalSource = ingestResult.source ?? created;
      }

      setSources(currentSources => upsertSource(currentSources, finalSource));
      setSelectedSourceId(getKnowledgeSourceId(finalSource));
      setIsCreateOpen(false);
      setCreateForm(createDefaultCreateForm());
      setCreateErrors({});
      setStatusMessage(
        createForm.documentFile
          ? "New source added and document uploaded."
          : createForm.ingestImmediately
            ? "New source added and ingestion started."
            : "New source added to the review queue.",
      );
    }
    catch (error) {
      setSelectedUploadStatus("failed");
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

    const canPreviewInBrowser = /text|json|csv|html|markdown/i.test(file.type)
      || /\.(txt|md|html|htm|csv|json)$/i.test(file.name);

    setCreateForm(current => ({
      ...current,
      documentFile: file,
    }));
    setCreateErrors(current => ({ ...current, document: undefined }));
    setSelectedUploadStatus("selected");

    if (!canPreviewInBrowser) {
      setStatusMessage(`Selected ${file.name}. It will be uploaded to the backend for extraction.`);
      return;
    }

    try {
      const text = await file.text();
      setCreateForm(current => ({
        ...current,
        rawContent: text,
      }));
      setStatusMessage(`Selected ${file.name} and loaded a text preview.`);
    }
    catch {
      setStatusMessage(`Selected ${file.name}. Browser preview failed, but backend upload is still available.`);
    }
  };

  const handleIngestSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    if (!source.rawText && !source.localFilePath) {
      setStatusMessage(
        "This source has no stored raw text or file path to ingest.",
      );
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

  const handleRefreshSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    if (!source.url) {
      setStatusMessage("Official source refresh requires a source URL.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await refreshKnowledgeSource(sourceId, {
        metadata: {
          refreshRequestedFrom: "admin_dashboard",
        },
      });
      const nextSource = result.source ?? source;
      setSources(currentSources => upsertSource(currentSources, nextSource));
      setSelectedSourceId(getKnowledgeSourceId(nextSource));
      setStatusMessage(
        result.metadataOnly
          ? `${nextSource.title} refreshed as metadata-only. Extract text before approving it for RAG.`
          : `${nextSource.title} refreshed with ${result.chunkCount ?? 0} chunk${result.chunkCount === 1 ? "" : "s"}.`,
      );
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not refresh source."));
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleUploadDocumentForSelectedSource = async () => {
    if (!selectedSource || !selectedUploadFile) {
      setStatusMessage("Select a source and document before uploading.");
      return;
    }

    const sourceId = getKnowledgeSourceId(selectedSource);

    if (!sourceId) {
      setStatusMessage("Selected source is missing an id.");
      return;
    }

    setIsSaving(true);
    setSelectedUploadStatus("uploading");

    try {
      setSelectedUploadStatus("extracting");
      const result = await uploadKnowledgeSourceDocument(
        sourceId,
        selectedUploadFile,
        { ingestImmediately: true },
      );
      const nextSource = result.source ?? selectedSource;
      setSources(currentSources => upsertSource(currentSources, nextSource));
      setSelectedSourceId(getKnowledgeSourceId(nextSource));
      setSelectedUploadStatus(result.error ? "failed" : "indexed");
      setStatusMessage(
        result.error
          ? `${nextSource.title} upload finished, but extraction failed.`
          : `${nextSource.title} uploaded and indexed with ${result.chunkCount ?? getChunkCount(nextSource)} chunk${(result.chunkCount ?? getChunkCount(nextSource)) === 1 ? "" : "s"}.`,
      );
      setSelectedUploadFile(null);
    }
    catch (error) {
      setSelectedUploadStatus("failed");
      setStatusMessage(getFriendlyError(error, "Could not upload source document."));
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleLoadChunks = async () => {
    if (!selectedSource) {
      setStatusMessage("Select a source before loading chunks.");
      return;
    }

    const sourceId = getKnowledgeSourceId(selectedSource);

    if (!sourceId) {
      setStatusMessage("Selected source is missing an id.");
      return;
    }

    setIsLoadingChunks(true);

    try {
      const chunks = await listKnowledgeSourceChunks(sourceId);
      setSourceChunks(chunks);
      setStatusMessage(
        chunks.length > 0
          ? `Loaded ${chunks.length} chunk preview${chunks.length === 1 ? "" : "s"}.`
          : "No chunks are available for this source yet.",
      );
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not load source chunks."));
    }
    finally {
      setIsLoadingChunks(false);
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
      setStatusMessage(
        getFriendlyError(error, "Could not update legal-review flag."),
      );
    }
  };

  const handleRejectSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);

    if (!sourceId) {
      return;
    }

    try {
      const rejected = await rejectKnowledgeSource(
        sourceId,
        "Rejected from the admin knowledge-source queue.",
      );
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
      setSources(currentSources =>
        currentSources.filter(
          item => getKnowledgeSourceId(item) !== sourceId,
        ),
      );
      setSelectedSourceId(currentId =>
        currentId === sourceId ? "" : currentId,
      );
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
            <p className="text-[12px] font-semibold text-[#1E293B]">
              Recent Knowledge Sources
            </p>
            {statusMessage
              ? (
                  <p className="mt-1 text-[12px] font-medium text-[#0F67AE]">
                    {statusMessage}
                  </p>
                )
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
                setCreateErrors({});
                setSelectedUploadStatus("idle");
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
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Source Name *
                      </p>
                      <input
                        type="text"
                        value={createForm.title}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            title: event.target.value,
                          }))}
                        placeholder="Community Safety Bulletin"
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.title)}`}
                      />
                      <FieldError message={createErrors.title} />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Category
                      </p>
                      <select
                        value={createForm.adminCategory}
                        onChange={(event) => {
                          const adminCategory = event.target
                            .value as CreateSourceFormState["adminCategory"];
                          setCreateForm(current => ({
                            ...current,
                            adminCategory,
                            sourceCategory:
                          adminCategory === "Scam Pattern"
                            ? "admin_content"
                            : adminCategory === "Support"
                              ? "official_support_source"
                              : "official_legal_source",
                            topic:
                          adminCategory === "Scam Pattern"
                            ? "scam"
                            : adminCategory === "Support"
                              ? "support"
                              : current.topic,
                            sourceType:
                          adminCategory === "Scam Pattern"
                            ? "Report"
                            : adminCategory === "Support"
                              ? "SupportResource"
                              : adminCategory === "Regulation"
                                ? "Regulation"
                                : "Act",
                          }));
                        }}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      >
                        {CATEGORY_OPTIONS.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Source Category *
                      </p>
                      <select
                        value={createForm.sourceCategory}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            sourceCategory: event.target
                              .value as KnowledgeSourceCategory,
                          }))}
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.sourceCategory)}`}
                      >
                        {SOURCE_CATEGORY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FieldError message={createErrors.sourceCategory} />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Publisher *
                      </p>
                      <input
                        type="text"
                        value={createForm.publisher}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            publisher: event.target.value,
                          }))}
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.publisher)}`}
                      />
                      <FieldError message={createErrors.publisher} />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        License Status *
                      </p>
                      <input
                        type="text"
                        list="knowledge-source-license-options"
                        value={createForm.licenseStatus}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            licenseStatus: event.target.value,
                          }))}
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.licenseStatus)}`}
                      />
                      <FieldError message={createErrors.licenseStatus} />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Jurisdiction
                      </p>
                      <select
                        value={createForm.jurisdiction}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            jurisdiction: event.target
                              .value as KnowledgeSourceJurisdiction,
                          }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      >
                        {JURISDICTION_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Topic
                      </p>
                      <select
                        value={createForm.topic}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            topic: event.target.value as KnowledgeSourceTopic,
                          }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      >
                        {TOPIC_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Source Type *
                      </p>
                      <select
                        value={createForm.sourceType}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            sourceType: event.target.value as KnowledgeSourceType,
                          }))}
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.sourceType)}`}
                      >
                        {SOURCE_TYPE_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <FieldError message={createErrors.sourceType} />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Source URL *
                      </p>
                      <input
                        type="url"
                        value={createForm.url}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            url: event.target.value,
                          }))}
                        placeholder="https://example.org/source"
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.url)}`}
                      />
                      <FieldError message={createErrors.url} />
                    </label>
                  </div>

                  <label className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                      Description
                    </p>
                    <textarea
                      rows={3}
                      value={createForm.description}
                      onChange={event =>
                        setCreateForm(current => ({
                          ...current,
                          description: event.target.value,
                        }))}
                      placeholder="Short note about what this source controls."
                      className="w-full resize-none rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                    />
                  </label>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Last Updated *
                      </p>
                      <input
                        type="date"
                        value={createForm.lastUpdated}
                        onChange={(event) => {
                          const lastUpdated = event.target.value;
                          setCreateForm(current => ({
                            ...current,
                            lastUpdated,
                            nextRefreshAt:
                          current.nextRefreshAt
                          || addDaysInputValue(lastUpdated, 90),
                          }));
                        }}
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.lastUpdated)}`}
                      />
                      <FieldError message={createErrors.lastUpdated} />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Refresh Date *
                      </p>
                      <input
                        type="date"
                        value={createForm.nextRefreshAt}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            nextRefreshAt: event.target.value,
                          }))}
                        className={`h-9 w-full rounded-md border bg-white px-3 text-sm text-[#334155] outline-none transition ${fieldBorder(createErrors.nextRefreshAt)}`}
                      />
                      <FieldError message={createErrors.nextRefreshAt} />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Review Due
                      </p>
                      <input
                        type="date"
                        value={createForm.nextReviewAt}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            nextReviewAt: event.target.value,
                          }))}
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                  </div>

                  <label className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                      Review Notes
                    </p>
                    <textarea
                      rows={2}
                      value={createForm.reviewNotes}
                      onChange={event =>
                        setCreateForm(current => ({
                          ...current,
                          reviewNotes: event.target.value,
                        }))}
                      placeholder="Record licence check, source currency, or counsel review notes."
                      className="w-full resize-none rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                    />
                  </label>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Constitutional / Legal Basis
                      </p>
                      <input
                        type="text"
                        value={createForm.constitutionalBasis}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            constitutionalBasis: event.target.value,
                          }))}
                        placeholder="Australian Constitution, Anti-Discrimination Act"
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                    <label className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                        Legislation Tags
                      </p>
                      <input
                        type="text"
                        value={createForm.legislationTags}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            legislationTags: event.target.value,
                          }))}
                        placeholder="racial hatred, vilification, discrimination"
                        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                      />
                    </label>
                  </div>

                  <label className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                      Resource Text For AI Ingestion
                    </p>
                    <textarea
                      rows={8}
                      value={createForm.rawContent}
                      onChange={event =>
                        setCreateForm(current => ({
                          ...current,
                          rawContent: event.target.value,
                        }))}
                      placeholder="Paste legislation, policy, guidance, or support content here."
                      className="w-full resize-none rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE]"
                    />
                  </label>

                  <div className="rounded-md border border-[#D8E3EE] bg-white p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                          Legal Document Upload
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#607B90]">
                          PDF, Word, TXT, MD, HTML, CSV, and JSON are accepted. PDFs and Word documents are uploaded to the backend for extraction.
                        </p>
                      </div>
                      <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#D8E3EE] bg-white px-3 text-sm font-semibold text-[#334155] transition hover:bg-[#F8FBFF]">
                        <FileUp className="h-4 w-4" />
                        Select Document
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.md,.html,.htm,.csv,.json,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html,text/csv,application/json"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            void handleFileUpload(file);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    {createForm.documentFile ? (
                      <div className="mt-3 flex flex-col gap-2 rounded-md border border-[#E4EAF1] bg-[#FAFCFF] px-3 py-2 text-[12px] text-[#475569] sm:flex-row sm:items-center sm:justify-between">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#0F67AE]" />
                          {getFileLabel(createForm.documentFile)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCreateForm(current => ({
                              ...current,
                              documentFile: null,
                            }));
                            setSelectedUploadStatus("idle");
                          }}
                          className="inline-flex h-7 items-center gap-1 rounded border border-[#D8E3EE] px-2 text-[11px] font-semibold text-[#B42318] transition hover:bg-[#FFF5F5]"
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#607B90]">
                      <span className="rounded-full bg-[#EEF6FF] px-2 py-1 font-semibold text-[#0F67AE]">
                        Upload status: {selectedUploadStatus}
                      </span>
                      {createForm.documentFile ? (
                        <span>Replacing is supported by selecting another file before saving.</span>
                      ) : null}
                    </div>
                    <FieldError message={createErrors.document} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-[12px] text-[#334155]">
                      <input
                        type="checkbox"
                        checked={createForm.legalReviewed}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            legalReviewed: event.target.checked,
                          }))}
                      />
                      Mark as legally reviewed
                    </label>
                    <label className="inline-flex items-center gap-2 text-[12px] text-[#334155]">
                      <input
                        type="checkbox"
                        checked={createForm.ingestImmediately}
                        onChange={event =>
                          setCreateForm(current => ({
                            ...current,
                            ingestImmediately: event.target.checked,
                          }))}
                      />
                      Ingest immediately after create
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setCreateForm(createDefaultCreateForm());
                        setCreateErrors({});
                        setSelectedUploadStatus("idle");
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

        <datalist id="knowledge-source-license-options">
          {LICENSE_STATUS_OPTIONS.map(option => (
            <option key={option} value={option} />
          ))}
        </datalist>

        <div className="grid gap-2 md:grid-cols-4">
          <div className="rounded-md border border-[#D8E3EE] bg-[#FAFCFF] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
              Due Refresh
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1E293B]">
              {queueStats.needsRefresh}
            </p>
          </div>
          <div className="rounded-md border border-[#D8E3EE] bg-[#FAFCFF] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
              Stale Excluded
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1E293B]">
              {queueStats.staleExcluded}
            </p>
          </div>
          <div className="rounded-md border border-[#D8E3EE] bg-[#FAFCFF] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
              Legal Review
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1E293B]">
              {queueStats.needsLegalReview}
            </p>
          </div>
          <div className="rounded-md border border-[#D8E3EE] bg-[#FAFCFF] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
              Ready Approval
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1E293B]">
              {queueStats.readyForApproval}
            </p>
          </div>
        </div>

        {readiness
          ? (
              <section className="rounded-[10px] border border-[#D8E3EE] bg-[#FAFCFF] p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                      Public Legal RAG Readiness
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold ${readinessStatusClass(readiness)}`}
                      >
                        {displayReadinessStatus(readiness)}
                      </span>
                      <span className="text-[12px] text-[#475569]">
                        {readiness.summary.eligibleLegalSources} eligible legal source
                        {readiness.summary.eligibleLegalSources === 1 ? "" : "s"} / {readiness.summary.totalOfficialSources} official sources
                      </span>
                    </div>
                  </div>
                  <div className="grid min-w-0 grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 lg:min-w-[520px]">
                    <div className="rounded-md border border-[#E4EAF1] bg-white px-3 py-2">
                      <p className="font-semibold text-[#607B90]">Citation Ready</p>
                      <p className="mt-1 text-base font-bold text-[#1E293B]">
                        {readiness.summary.eligibleCitationSources}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#E4EAF1] bg-white px-3 py-2">
                      <p className="font-semibold text-[#607B90]">Approved Current</p>
                      <p className="mt-1 text-base font-bold text-[#1E293B]">
                        {readiness.summary.approvedCurrentSources}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#E4EAF1] bg-white px-3 py-2">
                      <p className="font-semibold text-[#607B90]">Blocked</p>
                      <p className="mt-1 text-base font-bold text-[#1E293B]">
                        {readiness.summary.blockedSources}
                      </p>
                    </div>
                    <div className="rounded-md border border-[#E4EAF1] bg-white px-3 py-2">
                      <p className="font-semibold text-[#607B90]">Metadata Only</p>
                      <p className="mt-1 text-base font-bold text-[#1E293B]">
                        {readiness.summary.metadataOnlySources}
                      </p>
                    </div>
                  </div>
                </div>

                {readiness.blockers.length > 0
                  ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {readiness.blockers.slice(0, 6).map(blocker => (
                          <span
                            key={blocker.code}
                            className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-1 text-[10px] font-semibold text-[#92400E]"
                            title={blocker.sourceTitles.slice(0, 4).join(", ")}
                          >
                            {blocker.label}: {blocker.count}
                          </span>
                        ))}
                      </div>
                    )
                  : null}

                {priorityCoverageGaps.length > 0
                  ? (
                      <div className="mt-3 overflow-x-auto rounded-md border border-[#E4EAF1] bg-white">
                        <table className="w-full min-w-[680px] border-collapse text-left">
                          <thead className="bg-[#F8FBFF] text-[10px] uppercase tracking-wide text-[#607B90]">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Coverage Cell</th>
                              <th className="px-3 py-2 font-semibold">Eligible</th>
                              <th className="px-3 py-2 font-semibold">Needs Legal</th>
                              <th className="px-3 py-2 font-semibold">Needs Refresh</th>
                              <th className="px-3 py-2 font-semibold">No Chunks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {priorityCoverageGaps.map(cell => (
                              <tr
                                key={`${cell.sourceCategory}-${cell.jurisdiction}-${cell.topic}`}
                                className="border-t border-[#E4EAF1] text-[11px] text-[#1E293B]"
                              >
                                <td className="px-3 py-2 font-semibold">
                                  {displaySourceCategoryLabel(cell.sourceCategory)} / {cell.jurisdiction} / {cell.topic}
                                </td>
                                <td className="px-3 py-2 text-[#607B90]">
                                  {cell.eligibleSources}/{cell.totalSources}
                                </td>
                                <td className="px-3 py-2 text-[#607B90]">
                                  {cell.needsLegalReviewSources}
                                </td>
                                <td className="px-3 py-2 text-[#607B90]">
                                  {cell.needsRefreshSources}
                                </td>
                                <td className="px-3 py-2 text-[#607B90]">
                                  {cell.noChunkSources}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  : null}
              </section>
            )
          : null}

        <div className="overflow-x-auto rounded-[10px] border border-[#D5DEE7]">
          <table className="w-full min-w-full border-collapse text-left lg:min-w-[900px]">
            <thead className="bg-[#F8FBFF]">
              <tr className="text-[10px] uppercase tracking-wide text-[#607B90]">
                <th className="px-3 py-2 font-semibold">Source Name</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Jurisdiction</th>
                <th className="px-3 py-2 font-semibold">Ingestion</th>
                <th className="px-3 py-2 font-semibold">Legal</th>
                <th className="px-3 py-2 font-semibold">Approval</th>
                <th className="px-3 py-2 font-semibold">Last Ingested</th>
                <th className="px-3 py-2 font-semibold">Chunks</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-8 text-center text-[12px] text-[#607B90]"
                      >
                        Loading knowledge sources...
                      </td>
                    </tr>
                  )
                : null}
              {!isLoading && sources.length === 0
                ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-8 text-center text-[12px] text-[#607B90]"
                      >
                        No knowledge sources have been added yet.
                      </td>
                    </tr>
                  )
                : null}
              {sources.map((row) => {
                const sourceId = getKnowledgeSourceId(row);
                const category = displayCategory(row);
                const status = displayStatus(row);
                const adminIngestionStatus = getAdminIngestionStatus(row);
                const approvalBlockReason = getApprovalBlockReason(row);
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
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryClass(category)}`}
                      >
                        {category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#607B90]">
                      {row.jurisdiction}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ingestionClass(status)}`}
                      >
                        {adminIngestionStatus}
                      </span>
                      {row.ingestionStatus === "failed" && row.ingestionError ? (
                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-[#B42318]">
                          {row.ingestionError}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={row.legalReviewed ? "text-[#15803D]" : "text-[#B45309]"}>
                        {row.legalReviewed ? "Reviewed" : "Incomplete"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#607B90]">
                      {row.status}
                    </td>
                    <td className="px-3 py-2.5 text-[#607B90]">
                      {formatDate(row.ingestedAt)}
                    </td>
                    <td className="px-3 py-2.5 text-[#607B90]">
                      {getChunkCount(row)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          disabled={isSaving || (!row.rawText && getAdminIngestionStatus(row) !== "indexed")}
                          title={
                            row.rawText || getAdminIngestionStatus(row) === "indexed"
                              ? "Run ingestion from stored extracted text."
                              : "Upload or paste text before ingestion."
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleIngestSource(row);
                          }}
                          className="rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Ingest
                        </button>
                        <button
                          type="button"
                          disabled={isSaving || getChunkCount(row) <= 0}
                          title={
                            getChunkCount(row) > 0
                              ? "Re-index stored extracted text."
                              : "No chunks or extracted text are available to re-index."
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleReindexSource(row);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reindex
                        </button>
                        {isOfficialSource(row)
                          ? (
                              <button
                                type="button"
                                disabled={isSaving || !row.url || row.status === "archived" || row.status === "expired"}
                                title={
                                  row.url
                                    ? "Fetch the official URL and update verification metadata."
                                    : "Add a source URL before refreshing."
                                }
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleRefreshSource(row);
                                }}
                                className="inline-flex items-center gap-1 rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <RefreshCcw className="h-3 w-3" />
                                Refresh
                              </button>
                            )
                          : null}
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
                                disabled={Boolean(approvalBlockReason)}
                                title={approvalBlockReason || "Approve this source."}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void approveKnowledgeSource(sourceId)
                                    .then((approvedSource) => {
                                      setSources(currentSources =>
                                        upsertSource(
                                          currentSources,
                                          approvedSource,
                                        ),
                                      );
                                      setStatusMessage(
                                        `${approvedSource.title} approved.`,
                                      );
                                    })
                                    .catch((error: unknown) => {
                                      setStatusMessage(
                                        getFriendlyError(
                                          error,
                                          "Could not approve source.",
                                        ),
                                      );
                                    });
                                }}
                                className="rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )
                          : null}
                        {row.status !== "rejected" && row.status !== "archived" && row.status !== "expired"
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
                            setSelectedSourceId(sourceId);
                            setStatusMessage(`Viewing details for ${row.title}.`);
                          }}
                          className="rounded border border-[#D8E3EE] px-2 py-1 text-[10px] font-semibold text-[#475569] transition hover:bg-[#F8FBFF]"
                        >
                          Details
                        </button>
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

        <section className="rounded-[10px] border border-[#D8E3EE] bg-[#FAFCFF] p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B]">
                Registry Governance
              </h3>
              <p className="text-[11px] text-[#607B90]">
                Official sources need authoritative URLs, licensing, update
                metadata, refresh dates, and legal review before RAG can cite
                them.
              </p>
            </div>
            {selectedSource
              ? (
                  <span className="rounded-full border border-[#D8E3EE] bg-white px-2 py-1 text-[10px] font-semibold text-[#475569]">
                    {displaySourceCategory(selectedSource)}
                  </span>
                )
              : null}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Title
              </p>
              <input
                type="text"
                value={governanceDraft.title ?? ""}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    title: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Source Category
              </p>
              <select
                value={governanceDraft.sourceCategory}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    sourceCategory: event.target
                      .value as KnowledgeSourceCategory,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              >
                {SOURCE_CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Publisher
              </p>
              <input
                type="text"
                value={governanceDraft.publisher ?? ""}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    publisher: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                License Status
              </p>
              <input
                type="text"
                list="knowledge-source-license-options"
                value={governanceDraft.licenseStatus ?? ""}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    licenseStatus: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Jurisdiction
              </p>
              <select
                value={governanceDraft.jurisdiction}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    jurisdiction: event.target
                      .value as KnowledgeSourceJurisdiction,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              >
                {JURISDICTION_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Topic
              </p>
              <select
                value={governanceDraft.topic}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    topic: event.target.value as KnowledgeSourceTopic,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              >
                {TOPIC_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Source Type
              </p>
              <select
                value={governanceDraft.sourceType}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    sourceType: event.target.value as KnowledgeSourceType,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              >
                {SOURCE_TYPE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Language
              </p>
              <input
                type="text"
                value={governanceDraft.language ?? "en"}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    language: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Last Updated
              </p>
              <input
                type="date"
                value={governanceDraft.lastUpdated ?? ""}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    lastUpdated: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Refresh Date
              </p>
              <input
                type="date"
                value={governanceDraft.nextRefreshAt ?? ""}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    nextRefreshAt: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Review Due
              </p>
              <input
                type="date"
                value={governanceDraft.nextReviewAt ?? ""}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    nextReviewAt: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Source URL
              </p>
              <input
                type="url"
                value={governanceDraft.url ?? ""}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    url: event.target.value,
                  }))}
                className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
              />
            </label>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
                Source Document
              </p>
              <div className="flex flex-col gap-2 rounded-md border border-[#D8E3EE] bg-white p-2">
                <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#D8E3EE] px-3 text-xs font-semibold text-[#334155] transition hover:bg-[#F8FBFF]">
                  <FileUp className="h-3.5 w-3.5" />
                  Select Replacement
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md,.html,.htm,.csv,.json,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html,text/csv,application/json"
                    className="hidden"
                    disabled={!selectedSource}
                    onChange={(event) => {
                      setSelectedUploadFile(event.target.files?.[0] ?? null);
                      setSelectedUploadStatus(event.target.files?.[0] ? "selected" : "idle");
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {selectedUploadFile ? (
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#475569]">
                    <span className="truncate">{getFileLabel(selectedUploadFile)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUploadFile(null);
                        setSelectedUploadStatus("idle");
                      }}
                      className="text-[#B42318]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#607B90]">
                    {getMetadata(selectedSource).uploadedFile?.originalFileName
                      ? `Uploaded: ${getMetadata(selectedSource).uploadedFile?.originalFileName}`
                      : "No uploaded document recorded."}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EEF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#0F67AE]">
                    {selectedUploadStatus}
                  </span>
                  <button
                    type="button"
                    disabled={!selectedSource || !selectedUploadFile || isSaving}
                    onClick={() => void handleUploadDocumentForSelectedSource()}
                    className="h-7 rounded-md bg-[#0F67AE] px-3 text-[11px] font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Upload & Ingest
                  </button>
                </div>
              </div>
            </div>
          </div>

          <label className="mt-3 block space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">
              Review Notes
            </p>
            <textarea
              rows={3}
              value={governanceDraft.reviewNotes ?? ""}
              disabled={!selectedSource}
              onChange={event =>
                setGovernanceDraft(current => ({
                  ...current,
                  reviewNotes: event.target.value,
                }))}
              className="w-full resize-none rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-sm text-[#334155] outline-none transition focus:border-[#0F67AE] disabled:text-[#94A3B8]"
            />
          </label>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-[12px] text-[#334155]">
              <input
                type="checkbox"
                checked={Boolean(governanceDraft.legalReviewed)}
                disabled={!selectedSource}
                onChange={event =>
                  setGovernanceDraft(current => ({
                    ...current,
                    legalReviewed: event.target.checked,
                  }))}
              />
              Legal review complete
            </label>
            <button
              type="button"
              disabled={!selectedSource || isSaving}
              onClick={() => void saveGovernanceDetails()}
              className="inline-flex h-8 items-center justify-center rounded-md bg-[#0F67AE] px-3 text-xs font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Registry Details
            </button>
          </div>
        </section>

        <section className="rounded-[10px] border border-[#D8E3EE]">
          <div className="border-b border-[#E4EAF1] px-3 py-2">
            <h3 className="text-sm font-semibold text-[#1E293B]">
              Explanation Template Editor
            </h3>
            <p className="mt-0.5 text-[11px] text-[#607B90]">
              Editing response for:
              {" "}
              <span className="font-medium text-[#0F67AE]">
                {selectedSource?.title ?? "No source selected"}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {TEMPLATE_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTemplateTab(tab.id)}
                  className={
                    tab.id === activeTemplateTab
                      ? "rounded border border-[#0F67AE] bg-[#EEF6FF] px-2 py-0.5 font-medium text-[#0F67AE]"
                      : "rounded border border-[#D8E3EE] px-2 py-0.5 text-[#607B90] transition hover:bg-[#F8FBFF]"
                  }
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
                <h3 className="text-sm font-semibold text-[#1E293B]">
                  RAG Publishing Status
                </h3>
                <p className="mt-1 text-[11px] text-[#607B90]">
                  Approval makes this source available for retrieval only after all checks pass. This does not train the AI model.
                </p>
                <div
                  className={
                    isExcludedFromRag(selectedSource)
                      ? "mt-3 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#92400E]"
                      : "mt-3 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-[12px] text-[#166534]"
                  }
                >
                  <span className="inline-flex items-center gap-2 font-semibold">
                    {isExcludedFromRag(selectedSource)
                      ? <AlertCircle className="h-4 w-4" />
                      : <CheckCircle2 className="h-4 w-4" />}
                    {isExcludedFromRag(selectedSource)
                      ? "Not eligible for legal RAG"
                      : "Eligible for legal RAG answers"}
                  </span>
                  {isExcludedFromRag(selectedSource) ? (
                    <p className="mt-1">
                      {getRagEligibilityReasons(selectedSource).join("; ")}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2 text-[12px] text-[#475569] lg:grid-cols-2">
                  {getRagEligibilityChecks(selectedSource).map(check => (
                    <div
                      key={check.label}
                      className="flex items-center gap-2 rounded-md border border-[#E4EAF1] bg-white px-3 py-2"
                    >
                      <span
                        className={
                          check.passed
                            ? "inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#DCFCE7] text-[10px] font-bold text-[#15803D]"
                            : "inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#FEF3C7] text-[10px] font-bold text-[#B45309]"
                        }
                      >
                        {check.passed ? "✓" : "!"}
                      </span>
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-[12px] text-[#334155]">
                  <span className="font-semibold text-[#1E293B]">Next step:</span>
                  {" "}
                  {getRagNextStep(selectedSource)}
                </div>
                <h4 className="mt-4 text-sm font-semibold text-[#1E293B]">
                  Detected Legal Metadata
                </h4>
                <div className="mt-2 grid gap-2 text-[12px] text-[#475569] lg:grid-cols-2">
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Legal reviewed:
                    </span>
                    {" "}
                    {selectedSource.legalReviewed ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Ingestion:</span>
                    {" "}
                    {selectedSource.ingestionStatus ?? "metadata_only"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Last updated:
                    </span>
                    {" "}
                    {formatDate(selectedSource.lastUpdated)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Refresh date:
                    </span>
                    {" "}
                    {formatRefreshDue(selectedSource)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Last verified:
                    </span>
                    {" "}
                    {formatDate(selectedSource.lastVerifiedAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      RAG eligibility:
                    </span>
                    {" "}
                    {isExcludedFromRag(selectedSource)
                      ? `Not eligible: ${getRagNextStep(selectedSource)}`
                      : "Eligible for citations"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Detected type:
                    </span>
                    {" "}
                    {typeof selectedSourceMetadata.detectedLegalType === "string"
                      ? selectedSourceMetadata.detectedLegalType
                      : "Not detected"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">
                      Chunk count:
                    </span>
                    {" "}
                    {typeof selectedSourceMetadata.chunkCount === "number"
                      ? selectedSourceMetadata.chunkCount
                      : 0}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">
                      Acts / instruments:
                    </span>
                    {" "}
                    {Array.isArray(selectedSourceMetadata.detectedActNames)
                      && selectedSourceMetadata.detectedActNames.length
                      ? selectedSourceMetadata.detectedActNames.join(", ")
                      : "None detected"}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">
                      Sections / articles:
                    </span>
                    {" "}
                    {Array.isArray(selectedSourceMetadata.detectedSectionRefs)
                      && selectedSourceMetadata.detectedSectionRefs.length
                      ? selectedSourceMetadata.detectedSectionRefs.join(", ")
                      : "None detected"}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">
                      Constitutional mentions:
                    </span>
                    {" "}
                    {Array.isArray(
                      selectedSourceMetadata.detectedConstitutionalMentions,
                    )
                    && selectedSourceMetadata.detectedConstitutionalMentions.length
                      ? selectedSourceMetadata.detectedConstitutionalMentions.join(
                          ", ",
                        )
                      : "None detected"}
                  </p>
                  {selectedSource.ingestionStatus === "failed" && selectedSource.ingestionError
                    ? (
                        <p className="lg:col-span-2 text-[#B42318]">
                          <span className="font-semibold">Ingestion error:</span>
                          {" "}
                          {selectedSource.ingestionError}
                        </p>
                      )
                    : null}
                </div>

                <h4 className="mt-4 text-sm font-semibold text-[#1E293B]">
                  Source Details
                </h4>
                <div className="mt-2 grid gap-2 text-[12px] text-[#475569] lg:grid-cols-2">
                  <p>
                    <span className="font-semibold text-[#1E293B]">Approval:</span>
                    {" "}
                    {selectedSource.status}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Ingestion status:</span>
                    {" "}
                    {getAdminIngestionStatus(selectedSource)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Embedding/indexing:</span>
                    {" "}
                    {getEmbeddingStatus(selectedSource)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Created:</span>
                    {" "}
                    {formatDate(selectedSource.createdAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Updated:</span>
                    {" "}
                    {formatDate(selectedSource.updatedAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Approved:</span>
                    {" "}
                    {formatDate(selectedSource.approvedAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Legal reviewed:</span>
                    {" "}
                    {formatDate(selectedSource.legalReviewedAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#1E293B]">Ingested:</span>
                    {" "}
                    {formatDate(selectedSource.ingestedAt)}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">Uploaded file:</span>
                    {" "}
                    {selectedSourceMetadata.uploadedFile?.originalFileName
                      ? `${selectedSourceMetadata.uploadedFile.originalFileName} (${formatFileSize(selectedSourceMetadata.uploadedFile.fileSizeBytes)}, ${selectedSourceMetadata.uploadedFile.mimeType ?? "unknown type"})`
                      : "No uploaded file recorded"}
                  </p>
                  <p className="lg:col-span-2">
                    <span className="font-semibold text-[#1E293B]">Citation metadata:</span>
                    {" "}
                    {selectedSource.url || selectedSource.publisher
                      ? `${selectedSource.publisher}${selectedSource.url ? ` · ${selectedSource.url}` : ""}`
                      : "Not set"}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-md border border-[#D8E3EE] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#1E293B]">
                        Extracted Text Preview
                      </h4>
                      <span className="text-[10px] text-[#607B90]">
                        {selectedSource.rawText ? `${selectedSource.rawText.length} chars` : "Empty"}
                      </span>
                    </div>
                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-[#F8FBFF] p-3 text-[11px] leading-5 text-[#475569]">
                      {selectedSource.rawText?.slice(0, 3000) || "No extracted text is available yet."}
                    </pre>
                  </div>

                  <div className="rounded-md border border-[#D8E3EE] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#1E293B]">
                        Chunks Preview
                      </h4>
                      <button
                        type="button"
                        disabled={!selectedSource || isLoadingChunks}
                        onClick={() => void handleLoadChunks()}
                        className="h-7 rounded-md border border-[#D8E3EE] px-2 text-[11px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoadingChunks ? "Loading..." : "Load Chunks"}
                      </button>
                    </div>
                    <div className="mt-2 max-h-56 space-y-2 overflow-auto">
                      {sourceChunks.length > 0 ? sourceChunks.map(chunk => (
                        <div
                          key={chunk.id}
                          className="rounded-md border border-[#E4EAF1] bg-[#FAFCFF] p-2 text-[11px] leading-5 text-[#475569]"
                        >
                          <p className="font-semibold text-[#1E293B]">
                            Chunk {chunk.chunkIndex + 1}
                            {" "}
                            <span className="font-normal text-[#607B90]">
                              {chunk.tokenCount} tokens
                            </span>
                          </p>
                          <p className="mt-1">{chunk.text.slice(0, 700)}</p>
                          {chunk.citationLabel ? (
                            <p className="mt-1 text-[#607B90]">
                              Citation: {chunk.citationLabel}
                            </p>
                          ) : null}
                        </div>
                      )) : (
                        <p className="rounded-md bg-[#F8FBFF] p-3 text-[11px] text-[#607B90]">
                          No chunks loaded. Use Load Chunks after ingestion/indexing.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )
          : null}

        <div className="flex flex-col gap-2 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[#94A3B8]">
              {selectedSource?.updatedAt
                ? `Last synced ${formatSourceAge(selectedSource)}. Saving or approving updates retrieval metadata only, not model training.`
                : "Select a source to edit templates"}
            </p>
            {templateActionMessage ? (
              <p
                className={
                  templateActionMessage.tone === "success"
                    ? "font-semibold text-[#15803D]"
                    : "font-semibold text-[#B42318]"
                }
              >
                {templateActionMessage.text}
              </p>
            ) : null}
          </div>
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
              disabled={
                !selectedSource
                || isSaving
                || Boolean(selectedSource && getApprovalBlockReason(selectedSource))
              }
              title={
                selectedSource
                  ? getApprovalBlockReason(selectedSource) || "Save template metadata and approve."
                  : "Select a source first."
              }
              onClick={() => void saveTemplate(true)}
              className="inline-flex h-8 items-center rounded-md bg-[#F59E0B] px-3 font-semibold text-white transition hover:bg-[#D88B07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save & Approve for RAG
            </button>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
