import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CloudUpload,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  FileUp,
  Layers,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  RotateCcw,
  Scale,
  Server,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type {
  KnowledgeSourceCategory,
  KnowledgeSourceInput,
  KnowledgeSourceItem,
  KnowledgeSourceJurisdiction,
  KnowledgeSourceMetadata,
  KnowledgeSourceReadiness,
  KnowledgeSourceTopic,
  KnowledgeSourceType,
  PineconeHealth,
} from "@/lib/knowledge-sources";

import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import {
  approveKnowledgeSource,
  createKnowledgeSource,
  deleteKnowledgeSource,
  getKnowledgeSourceId,
  getKnowledgeSourceReadiness,
  getPineconeHealth,
  ingestKnowledgeSource,
  listKnowledgeSources,
  refreshKnowledgeSource,
  reindexKnowledgeSource,
  rejectKnowledgeSource,
  updateKnowledgeSource,
  uploadKnowledgeSourceDocument,
} from "@/lib/knowledge-sources";
import { ApiRequestError } from "@/lib/api";

const TEMPLATE_TABS = [
  {
    id: "riskPhrasing",
    label: "Risk Phrasing",
    legacyValue: `Based on recent reports of {Scam_Type}, we have identified a high probability of fraudulent activity.\n\nThis pattern typically involves long-term emotional manipulation followed by requests for cryptocurrency transfers.\n\nRecommendation: Cease all communication immediately. Do not transfer any funds. The platform advises users to report this profile.`,
    placeholder: "Add the saved risk wording you want the AI to use when this source is retrieved.",
  },
  {
    id: "disclaimerPhrasing",
    label: "Disclaimer Phrasing",
    legacyValue: `SafeSpeak provides guidance and referral support, not legal advice.\n\nBefore sharing information with a partner organization, confirm the user's consent status and review any jurisdiction-specific requirements.\n\nUse plain, non-judgmental language in every explanation.`,
    placeholder: "Add the disclaimer wording you want returned with this source.",
  },
  {
    id: "generalResponses",
    label: "General Responses",
    legacyValue: `Acknowledge the user's experience, summarise the immediate safety steps, and provide the next best support option.\n\nWhen confidence is low, route the draft to human review before publishing or sharing externally.`,
    placeholder: "Add general response guidance for answers grounded in this source.",
  },
] as const;
type TemplateTabId = (typeof TEMPLATE_TABS)[number]["id"];
type TemplateDraftState = Record<TemplateTabId, string>;

const SOURCE_CATEGORY_OPTIONS: Array<{
  value: KnowledgeSourceCategory;
  label: string;
}> = [
  { value: "official_legal_source", label: "Official legal source / legislation" },
  { value: "official_support_source", label: "Government guidance / official guidance source" },
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
  "racial",
  "racial_hatred",
  "online_safety",
  "scam",
  "migrant",
  "privacy",
  "workplace",
  "dv",
  "evidence",
  "support",
  "safespeak_policy",
  "consent",
  "crisis",
  "education",
  "local_intelligence",
  "smart_dialler",
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
const KNOWLEDGE_SOURCE_DRAFT_STORAGE_KEY = "safespeak_knowledge_source_draft_id";
const LICENSE_STATUS_OPTIONS = [
  "Government copyright",
  "Public domain",
  "CC BY",
  "CC BY-SA",
  "Agency permission required",
  "Internal use",
] as const;

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
  | "sourceAuthority"
  | "authority"
  | "topic"
  | "sourceType"
  | "language"
  | "url"
  | "localFilePath"
  | "publisher"
  | "licenseStatus"
  | "lastUpdated"
  | "sourceDate"
  | "nextReviewAt"
  | "nextRefreshAt"
  | "refreshCadence"
  | "legalReviewed"
  | "reviewNotes"
> & {
  customTopic?: string;
};

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

function getFriendlyError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error instanceof ApiRequestError && Array.isArray(error.errors) && error.errors.length > 0) {
    const details = error.errors
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }

        const record = item as {
          field?: unknown;
          message?: unknown;
          loc?: unknown;
          msg?: unknown;
        };
        const location = Array.isArray(record.loc)
          ? record.loc
            .filter(part => typeof part === "string" || typeof part === "number")
            .map(part => String(part))
            .join(".")
          : undefined;
        const field
          = typeof record.field === "string"
            ? record.field
            : location || "field";
        const message
          = typeof record.message === "string"
            ? record.message
            : typeof record.msg === "string"
              ? record.msg
              : "Invalid value";

        return `${field}: ${message}`;
      })
      .filter(Boolean)
      .join(" | ");

    if (details) {
      return details;
    }
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

function getIndexedChunkCount(source: KnowledgeSourceItem) {
  const indexedChunkCount = getMetadata(source).indexedChunkCount;

  return typeof indexedChunkCount === "number" ? indexedChunkCount : 0;
}

function hasStoredContent(source: KnowledgeSourceItem) {
  return Boolean(source.hasStoredContent || source.localFilePath);
}

function getIndexingProgressLabel(source: KnowledgeSourceItem) {
  const chunkCount = getChunkCount(source);
  const indexedChunkCount = getIndexedChunkCount(source);

  if (chunkCount <= 0) {
    return "";
  }

  return `${indexedChunkCount}/${chunkCount} indexed`;
}

function isRagFullyReady(source: KnowledgeSourceItem) {
  return (
    getAdminIngestionStatus(source) === "indexed"
    && getChunkCount(source) > 0
    && source.status === "approved"
    && !isExcludedFromRag(source)
  );
}

function getExtractionConfidenceLabel(source: KnowledgeSourceItem) {
  const chunkCount = getChunkCount(source);

  if (isRagFullyReady(source)) {
    return `RAG ready: extracted, chunked, indexed, and approved (${chunkCount} chunks)`;
  }

  if (getAdminIngestionStatus(source) === "indexed" && chunkCount > 0) {
    return `RAG data created: extracted and indexed (${chunkCount} chunks). Waiting for approval.`;
  }

  if (source.ingestionStatus === "failed") {
    return "Extraction failed. RAG data was not created.";
  }

  if (source.ingestionStatus === "partial_index_failed") {
    return "Partial indexing failure. RAG data is incomplete.";
  }

  if (source.ingestionStatus === "chunked" && chunkCount > 0) {
    return `Text extracted and chunked (${chunkCount} chunks). Indexing still needs to finish.`;
  }

  if (source.ingestionStatus === "metadata_only") {
    return "Registry saved, but document extraction/indexing has not completed yet.";
  }

  return "RAG preparation is still in progress.";
}

function getChunkSummaryLabel(source: KnowledgeSourceItem) {
  const chunkCount = getChunkCount(source);
  const indexedChunkCount = getIndexedChunkCount(source);

  if (chunkCount <= 0) {
    return "No RAG chunks yet";
  }

  if (indexedChunkCount > 0) {
    return `${indexedChunkCount} indexed chunks ready`;
  }

  return `${chunkCount} chunks created`;
}

function isLiveRagSource(source: KnowledgeSourceItem) {
  return (
    source.sourceCategory === "official_legal_source"
    || source.sourceCategory === "official_support_source"
    || source.sourceType === "Act"
    || source.sourceType === "Regulation"
  );
}

function getAdminIngestionStatus(source: KnowledgeSourceItem) {
  const metadata = getMetadata(source);
  const pipelineStatus = metadata.ingestionPipeline?.status;
  const chunkCount = getChunkCount(source);
  const readinessStatus = metadata.searchReadinessStatus;

  if (source.deletedAt || source.status === "archived" || source.status === "expired") {
    return "needs_review";
  }
  if (
    source.ingestionStatus === "partial_index_failed"
    || pipelineStatus === "partial_index_failed"
  ) {
    return "partial_failed";
  }
  if (source.ingestionStatus === "failed" || pipelineStatus === "failed") {
    return "failed";
  }
  if (readinessStatus === "indexing") {
    return "indexing";
  }
  if (readinessStatus === "indexed_pending_search") {
    return "pending_search";
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

function getRagEligibilityReasons(source: KnowledgeSourceItem) {
  const reasons: string[] = [];

  if (source.deletedAt || source.status === "archived" || source.status === "expired") {
    reasons.push("Source archived");
  }
  if (source.status !== "approved") {
    reasons.push("Not approved yet");
  }
  if (source.sourceCategory === "official_legal_source" && !source.legalReviewed) {
    reasons.push("Legal review incomplete");
  }
  if (source.ingestionStatus === "failed") {
    reasons.push(source.ingestionError || "PDF extraction failed");
  }
  if (source.ingestionStatus === "partial_index_failed") {
    reasons.push(source.ingestionError || "Some chunks failed to index");
  }
  if (getAdminIngestionStatus(source) !== "indexed") {
    reasons.push("No indexed chunks available");
  }
  if (getChunkCount(source) <= 0) {
    reasons.push("No indexed chunks available");
  }
  if (!isLiveRagSource(source)) {
    reasons.push("Source category is not enabled for live RAG");
  }
  if (isOfficialSource(source) && isRefreshDue(source)) {
    reasons.push("Source refresh is due");
  }
  if (isReviewDue(source)) {
    reasons.push("Review date is due");
  }

  return Array.from(new Set(reasons));
}

function getApprovalBlockReason(source: KnowledgeSourceItem) {
  if (source.status === "approved") {
    return "Already approved.";
  }
  if (source.status === "archived" || source.status === "expired") {
    return "Archived sources cannot be approved.";
  }
  if (getAdminIngestionStatus(source) !== "indexed") {
    return "Finish extraction and indexing before approval.";
  }
  if (source.sourceCategory === "official_legal_source" && !source.legalReviewed) {
    return "Legal review must be completed before approval.";
  }
  if (isOfficialSource(source) && isRefreshDue(source)) {
    return "Refresh the source before approval.";
  }
  if (isReviewDue(source)) {
    return "Review due date has expired.";
  }

  return "";
}

function displayCategory(source: KnowledgeSourceItem) {
  const metadataCategory = getMetadata(source).adminCategory;

  if (source.sourceCategory === "official_support_source") {
    return "Guidance";
  }

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

  if (getAdminIngestionStatus(source) === "partial_failed") {
    return "Partial Index Failure";
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

  if (getAdminIngestionStatus(source) === "pending_search") {
    return "Indexed Pending Search";
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

function buildSourceMetadata(
  draft?: GovernanceDraft,
  templates?: TemplateDraftState,
): KnowledgeSourceMetadata {
  const cleanedTemplates = Object.fromEntries(
    TEMPLATE_TABS.map((tab) => {
      const value = templates?.[tab.id] ?? "";
      const trimmedValue = value.trim();
      return [
        tab.id,
        trimmedValue && trimmedValue !== tab.legacyValue ? trimmedValue : undefined,
      ];
    }).filter(([, value]) => typeof value === "string" && value.length > 0),
  );

  return {
    adminCategory:
      draft?.sourceType === "Regulation"
        ? "Regulation"
        : draft?.sourceCategory === "admin_content"
          ? "Scam Pattern"
          : "Legislation",
    templates: cleanedTemplates,
    customTopic: draft?.customTopic?.trim() || undefined,
  };
}

function buildTemplateDrafts(
  source?: KnowledgeSourceItem,
): TemplateDraftState {
  return Object.fromEntries(
    TEMPLATE_TABS.map(tab => [tab.id, getTemplateValue(source, tab.id)]),
  ) as TemplateDraftState;
}

function getTemplateValue(
  source: KnowledgeSourceItem | undefined,
  tabId: TemplateTabId,
) {
  const templateValue = getMetadata(source).templates?.[tabId];
  const tab = TEMPLATE_TABS.find(item => item.id === tabId);

  if (
    typeof templateValue === "string"
    && templateValue.trim()
    && templateValue.trim() !== tab?.legacyValue
  ) {
    return templateValue;
  }

  return "";
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
  const lastUpdated = todayInputValue();

  return {
    title: source?.title ?? "",
    description: source?.description ?? "",
    sourceCategory: source?.sourceCategory ?? "official_legal_source",
    jurisdiction: source?.jurisdiction ?? "AU",
    sourceAuthority: source?.sourceAuthority ?? source?.publisher ?? "",
    authority: source?.authority ?? source?.sourceAuthority ?? source?.publisher ?? "",
    topic: source?.topic ?? "other",
    sourceType: source?.sourceType ?? "Guideline",
    language: source?.language ?? "en",
    url: source?.url ?? "",
    localFilePath: source?.localFilePath ?? "",
    publisher: source?.publisher ?? "",
    licenseStatus: source?.licenseStatus ?? "Government copyright",
    lastUpdated: toDateInputValue(source?.lastUpdated) || lastUpdated,
    sourceDate: toDateInputValue(source?.sourceDate) || toDateInputValue(source?.lastUpdated) || lastUpdated,
    nextReviewAt: toDateInputValue(source?.nextReviewAt),
    nextRefreshAt: toDateInputValue(source?.nextRefreshAt) || addDaysInputValue(lastUpdated, 90),
    refreshCadence: source?.refreshCadence ?? "quarterly",
    legalReviewed: source?.legalReviewed ?? false,
    reviewNotes: source?.reviewNotes ?? "",
    customTopic: typeof source?.metadata?.customTopic === "string" ? source.metadata.customTopic : "",
  };
}

function compactGovernancePayload(
  draft: GovernanceDraft,
): Partial<KnowledgeSourceInput> {
  const {
    customTopic: _customTopic,
    ...payloadDraft
  } = draft;
  const publisher = draft.publisher?.trim() || undefined;
  const sourceAuthority = draft.sourceAuthority?.trim() || publisher;

  return {
    ...payloadDraft,
    description: draft.description?.trim() || undefined,
    url: draft.url?.trim() || undefined,
    localFilePath: draft.localFilePath?.trim() || undefined,
    publisher,
    sourceAuthority,
    authority: draft.authority?.trim() || sourceAuthority,
    licenseStatus: draft.licenseStatus?.trim() || undefined,
    lastUpdated: draft.lastUpdated || undefined,
    sourceDate: draft.sourceDate || draft.lastUpdated || undefined,
    nextReviewAt: draft.nextReviewAt || undefined,
    nextRefreshAt: draft.nextRefreshAt || undefined,
    refreshCadence: draft.refreshCadence?.trim() || "quarterly",
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

function formatVectorIndexLabel(readiness: KnowledgeSourceReadiness) {
  return `${readiness.configuration.vectorIndex.indexName} (${readiness.configuration.vectorIndex.status})`;
}

function getReadinessBadgeClass(status: string) {
  if (status === "ready") {
    return "bg-emerald-50 border-emerald-100 text-emerald-700";
  }
  if (status === "ready_with_gaps") {
    return "bg-amber-50 border-amber-100 text-amber-700";
  }
  return "bg-rose-50 border-rose-100 text-rose-700";
}

function getReadinessDotClass(status: string) {
  if (status === "ready") {
    return "bg-emerald-500 animate-pulse";
  }
  if (status === "ready_with_gaps") {
    return "bg-amber-500 animate-pulse";
  }
  return "bg-rose-500 animate-ping";
}

function getStatusBannerClass(message: string) {
  if (message.includes("expired") || message.includes("Error") || message.includes("Could not") || message.includes("required") || message.includes("title is required")) {
    return "bg-rose-50 border-rose-100 text-rose-700";
  }
  if (message.includes("Loading")) {
    return "bg-blue-50 border-blue-100 text-blue-700 animate-pulse";
  }
  return "bg-emerald-50 border-emerald-100 text-emerald-700";
}

function getIngestionStatusBadgeClass(status: string) {
  if (status === "indexed") {
    return "bg-emerald-50 border-emerald-100 text-emerald-700";
  }
  if (status === "failed" || status === "partial_failed") {
    return "bg-rose-50 border-rose-100 text-rose-700";
  }
  return "bg-amber-50 border-amber-100 text-amber-700";
}

function getIngestionStatusDotClass(status: string) {
  if (status === "indexed") {
    return "bg-emerald-500";
  }
  if (status === "failed" || status === "partial_failed") {
    return "bg-rose-500 animate-pulse";
  }
  return "bg-amber-500 animate-pulse";
}

function getApprovalStatusBadgeClass(status: string) {
  if (status === "approved") {
    return "bg-emerald-100 border-emerald-200 text-emerald-800 bg-[#E8FDF0]";
  }
  if (status === "pending_review") {
    return "bg-[#EEF6FF] border-blue-100 text-blue-700";
  }
  if (status === "draft") {
    return "bg-slate-100 border-slate-200 text-slate-600";
  }
  return "bg-rose-50 border-rose-100 text-rose-700";
}

function getStatusIcon(message: string) {
  if (message.includes("expired") || message.includes("Error") || message.includes("Could not") || message.includes("required") || message.includes("title is required")) {
    return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />;
  }
  if (message.includes("Loading")) {
    return <RefreshCcw className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" />;
  }
  return <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />;
}

function getCategoryBadgeClass(category: string) {
  if (category === "Legislation") {
    return "bg-blue-50 border-blue-100 text-blue-700";
  }
  if (category === "Scam Pattern") {
    return "bg-rose-50 border-rose-100 text-rose-700";
  }
  if (category === "Regulation") {
    return "bg-purple-50 border-purple-100 text-purple-700";
  }
  return "bg-slate-50 border-slate-100 text-slate-700";
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(",")}}`;
}

function getStoredDraftSourceId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(KNOWLEDGE_SOURCE_DRAFT_STORAGE_KEY) ?? "";
}

function setStoredDraftSourceId(sourceId: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (!sourceId) {
    window.localStorage.removeItem(KNOWLEDGE_SOURCE_DRAFT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(KNOWLEDGE_SOURCE_DRAFT_STORAGE_KEY, sourceId);
}

export function AdminContentKnowledgeSourcesPage() {
  const [sources, setSources] = useState<KnowledgeSourceItem[]>([]);
  const [readiness, setReadiness] = useState<KnowledgeSourceReadiness | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateTabId>(
    TEMPLATE_TABS[0].id,
  );
  const [templateDrafts, setTemplateDrafts] = useState<TemplateDraftState>(
    buildTemplateDrafts(),
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [governanceDraft, setGovernanceDraft] = useState<GovernanceDraft>(() =>
    buildGovernanceDraft(undefined),
  );
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [selectedUploadStatus, setSelectedUploadStatus] = useState<DocumentUploadStatus>("idle");
  const [pineconeHealth, setPineconeHealth] = useState<PineconeHealth | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    "Loading knowledge sources...",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedDraftFingerprint, setLastSavedDraftFingerprint] = useState<string>("");
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const templateDraft = templateDrafts[activeTemplateTab] ?? "";

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("template-textarea") as HTMLTextAreaElement;
    if (!textarea) {
      setTemplateDrafts(current => ({
        ...current,
        [activeTemplateTab]: (current[activeTemplateTab] ?? "") + variable,
      }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newText = before + variable + after;
    setTemplateDrafts(current => ({
      ...current,
      [activeTemplateTab]: newText,
    }));
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      setSelectedUploadFile(e.dataTransfer.files[0]);
      setSelectedUploadStatus("selected");
    }
  };

  const openCreateSourceForm = () => {
    const storedDraftId = getStoredDraftSourceId();
    const resumableDraft = (storedDraftId
      ? sources.find(source =>
          getKnowledgeSourceId(source) === storedDraftId && source.status === "draft",
        )
      : undefined)
      ?? sources.find(source => source.status === "draft");

    setIsCreateOpen(true);

    if (resumableDraft) {
      const resumableDraftId = getKnowledgeSourceId(resumableDraft);
      setSelectedSourceId(resumableDraftId);
      setStoredDraftSourceId(resumableDraftId);
      setStatusMessage(`Loaded saved draft: ${resumableDraft.title}`);
      return;
    }

    setSelectedSourceId("");
    setGovernanceDraft(buildGovernanceDraft(undefined));
    setTemplateDrafts(buildTemplateDrafts());
    setSelectedUploadFile(null);
    setSelectedUploadStatus("idle");
    setStatusMessage("Add the registry details and upload the source document for RAG.");
  };

  const closeCreateSourceForm = (message = "Returned to knowledge sources.") => {
    setIsCreateOpen(false);
    setSelectedSourceId("");
    setSelectedUploadStatus("idle");
    setSelectedUploadFile(null);
    setStatusMessage(message);
  };

  const loadSources = useCallback(async () => {
    setIsLoading(true);

    try {
      const [items, readinessResult, pineconeHealthResult] = await Promise.all([
        listKnowledgeSources(),
        getKnowledgeSourceReadiness(),
        getPineconeHealth(),
      ]);

      setSources(items);
      setReadiness(readinessResult);
      setPineconeHealth(pineconeHealthResult);
      setStatusMessage(
        items.length > 0
          ? "Knowledge-source workflows are active."
          : "No knowledge sources found.",
      );
    }
    catch (error) {
      setReadiness(null);
      setPineconeHealth(null);
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

  useEffect(() => {
    const storedDraftId = getStoredDraftSourceId();

    if (!storedDraftId) {
      return;
    }

    const storedDraftExists = sources.some(
      source => getKnowledgeSourceId(source) === storedDraftId && source.status === "draft",
    );

    if (!storedDraftExists) {
      setStoredDraftSourceId("");
    }
  }, [sources]);

  const selectedSource = useMemo(
    () => {
      if (isCreateOpen && !selectedSourceId) {
        return undefined;
      }
      return sources.find(
        source => getKnowledgeSourceId(source) === selectedSourceId,
      );
    },
    [isCreateOpen, selectedSourceId, sources],
  );
  const persistedUploadedFile = useMemo(
    () => getMetadata(selectedSource).uploadedFile,
    [selectedSource],
  );
  const persistedUploadStatus = useMemo(() => {
    if (!selectedSource || !persistedUploadedFile) {
      return null;
    }

    const metadata = getMetadata(selectedSource);

    if (selectedSource.ingestionStatus === "embedded" || getIndexedChunkCount(selectedSource) > 0) {
      return {
        label: "Uploaded and indexed",
        tone: "indexed" as const,
      };
    }

    if (metadata.extractionStatus === "pending_upload_ingest") {
      return {
        label: "Uploaded and waiting for ingest",
        tone: "pending" as const,
      };
    }

    if (selectedSource.ingestionStatus === "failed") {
      return {
        label: "Uploaded, but indexing failed",
        tone: "failed" as const,
      };
    }

    return {
      label: "Uploaded document saved",
      tone: "saved" as const,
    };
  }, [persistedUploadedFile, selectedSource]);
  
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
  
  const isRegistryEditable = Boolean(selectedSource) || isCreateOpen;
  const draftFingerprint = useMemo(
    () =>
      stableStringify({
        governanceDraft,
        templateDrafts,
        selectedUploadFileName: selectedUploadFile?.name ?? "",
        selectedUploadFileSize: selectedUploadFile?.size ?? 0,
      }),
    [governanceDraft, templateDrafts, selectedUploadFile],
  );
  const isSavedDraftRecord = Boolean(selectedSource && selectedSource.status === "draft");
  const isDraftDirty = !isSavedDraftRecord || draftFingerprint !== lastSavedDraftFingerprint;

  useEffect(() => {
    if (isCreateOpen && !selectedSource) {
      setLastSavedDraftFingerprint("");
      return;
    }

    setTemplateDrafts(buildTemplateDrafts(selectedSource));
    setGovernanceDraft(buildGovernanceDraft(selectedSource));
    setSelectedUploadFile(null);
    setSelectedUploadStatus("idle");
    setLastSavedDraftFingerprint("");
  }, [activeTemplateTab, isCreateOpen, selectedSource]);

  useEffect(() => {
    if (!selectedSource || selectedSource.status !== "draft") {
      return;
    }

    const nextFingerprint = stableStringify({
      governanceDraft: buildGovernanceDraft(selectedSource),
      templateDrafts: buildTemplateDrafts(selectedSource),
      selectedUploadFileName: "",
      selectedUploadFileSize: 0,
    });

    setLastSavedDraftFingerprint(nextFingerprint);
  }, [selectedSource]);

  const reapplyLegalReviewAfterUpload = async (
    sourceId: string,
    fallbackSource: KnowledgeSourceItem,
  ) => {
    if (
      governanceDraft.sourceCategory !== "official_legal_source"
      || !governanceDraft.legalReviewed
    ) {
      return fallbackSource;
    }

    return await updateKnowledgeSource(sourceId, {
      legalReviewed: true,
    });
  };

  const saveGovernanceDetails = async (publish = false) => {
    const isNewSourceDraft = isCreateOpen && !selectedSource;
    const title = governanceDraft.title?.trim();

    if (!title) {
      setStatusMessage("Error: Source title is required.");
      return;
    }

    if (
      governanceDraft.sourceCategory?.startsWith("official_")
      && !governanceDraft.url?.trim()
    ) {
      setStatusMessage("Error: Official sources require a URL.");
      return;
    }

    if (isNewSourceDraft && !selectedUploadFile) {
      setStatusMessage("Error: Upload a document before saving a new RAG source.");
      return;
    }

    setIsSaving(true);

    try {
      if (isNewSourceDraft) {
        const created = await createKnowledgeSource({
          ...compactGovernancePayload(governanceDraft),
          title,
          description:
            governanceDraft.description?.trim()
            || "Admin-created source awaiting review.",
          sourceCategory: governanceDraft.sourceCategory || "official_legal_source",
          jurisdiction: governanceDraft.jurisdiction || "AU",
          topic: governanceDraft.topic || "other",
          sourceType: governanceDraft.sourceType || "Guideline",
          language: governanceDraft.language?.trim() || "en",
          publisher: governanceDraft.publisher?.trim() || "SafeSpeak Content Team",
          licenseStatus:
            governanceDraft.licenseStatus?.trim() || "Government copyright",
          status: "pending_review",
          version: 1,
          metadata: buildSourceMetadata(governanceDraft, templateDrafts),
        });

        let finalSource = created;
        const createdId = getKnowledgeSourceId(created);

        if (createdId && selectedUploadFile) {
          setSelectedUploadStatus("uploading");
          const uploadResult = await uploadKnowledgeSourceDocument(
            createdId,
            selectedUploadFile,
            { ingestImmediately: true },
          );
          setSelectedUploadStatus(uploadResult.error ? "failed" : "indexed");
          finalSource = uploadResult.source ?? created;
          finalSource = await reapplyLegalReviewAfterUpload(createdId, finalSource);
        }

        if (publish && createdId) {
          finalSource = await approveKnowledgeSource(createdId);
        }

        setSources(currentSources => upsertSource(currentSources, finalSource));
        setSelectedSourceId(getKnowledgeSourceId(finalSource));
        setStoredDraftSourceId("");
        setStatusMessage(
          publish
            ? `${finalSource.title} created and approved for RAG.`
            : "Registry details saved."
        );
      }
      else {
        if (!selectedSource) {
          setStatusMessage("Error: Select a source.");
          return;
        }

        const sourceId = getKnowledgeSourceId(selectedSource);
        const updated = await updateKnowledgeSource(sourceId, {
          ...compactGovernancePayload(governanceDraft),
          metadata: {
            ...getMetadata(selectedSource),
            ...buildSourceMetadata(governanceDraft, templateDrafts),
          }
        });
        let finalSource = updated;

        if (selectedUploadFile) {
          setSelectedUploadStatus("uploading");
          const uploadResult = await uploadKnowledgeSourceDocument(
            sourceId,
            selectedUploadFile,
            { ingestImmediately: true },
          );
          setSelectedUploadStatus(uploadResult.error ? "failed" : "indexed");
          finalSource = uploadResult.source ?? updated;
          finalSource = await reapplyLegalReviewAfterUpload(sourceId, finalSource);
        }

        if (publish) {
          finalSource = await approveKnowledgeSource(sourceId);
        }

        setSources(currentSources => upsertSource(currentSources, finalSource));
        setSelectedSourceId(getKnowledgeSourceId(finalSource));
        setStoredDraftSourceId("");
        setStatusMessage(
          publish
            ? `${finalSource.title} saved and approved.`
            : `${finalSource.title} registry details saved.`
        );
      }
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

  const saveDraftSource = async () => {
    const title = governanceDraft.title?.trim();

    if (!title) {
      setStatusMessage("Error: Add a title before saving a draft.");
      return;
    }

    setIsSaving(true);

    try {
      if (!selectedSource) {
        const created = await createKnowledgeSource({
          ...compactGovernancePayload(governanceDraft),
          title,
          description: "Admin draft source.",
          sourceCategory: governanceDraft.sourceCategory || "official_legal_source",
          jurisdiction: governanceDraft.jurisdiction || "AU",
          topic: governanceDraft.topic || "other",
          sourceType: governanceDraft.sourceType || "Guideline",
          language: governanceDraft.language?.trim() || "en",
          publisher: governanceDraft.publisher?.trim() || "SafeSpeak Content Team",
          licenseStatus: governanceDraft.licenseStatus?.trim() || "Government copyright",
          status: "draft",
          version: 1,
          metadata: buildSourceMetadata(governanceDraft, templateDrafts),
        });

        const createdId = getKnowledgeSourceId(created);
        let finalSource = created;

        if (createdId && selectedUploadFile) {
          setSelectedUploadStatus("uploading");
          const uploadResult = await uploadKnowledgeSourceDocument(
            createdId,
            selectedUploadFile,
            { ingestImmediately: false },
          );
          setSelectedUploadStatus(uploadResult.error ? "failed" : "needs_review");
          finalSource = uploadResult.source ?? created;
          finalSource = await reapplyLegalReviewAfterUpload(createdId, finalSource);
        }

        setSources(currentSources => upsertSource(currentSources, finalSource));
        const finalSourceId = getKnowledgeSourceId(finalSource);
        setSelectedSourceId(finalSourceId);
        setStoredDraftSourceId(finalSourceId);
        setLastSavedDraftFingerprint(draftFingerprint);
        setStatusMessage(`${finalSource.title} saved as draft.`);
      }
      else {
        const sourceId = getKnowledgeSourceId(selectedSource);
        let finalSource = await updateKnowledgeSource(sourceId, {
          ...compactGovernancePayload(governanceDraft),
          status: "draft",
          metadata: {
            ...getMetadata(selectedSource),
            ...buildSourceMetadata(governanceDraft, templateDrafts),
          },
        });

        if (selectedUploadFile) {
          setSelectedUploadStatus("uploading");
          const uploadResult = await uploadKnowledgeSourceDocument(
            sourceId,
            selectedUploadFile,
            { ingestImmediately: false },
          );
          setSelectedUploadStatus(uploadResult.error ? "failed" : "needs_review");
          finalSource = uploadResult.source ?? finalSource;
          finalSource = await reapplyLegalReviewAfterUpload(sourceId, finalSource);
        }

        setSources(currentSources => upsertSource(currentSources, finalSource));
        setStoredDraftSourceId(getKnowledgeSourceId(finalSource));
        setLastSavedDraftFingerprint(draftFingerprint);
        setStatusMessage(`${finalSource.title} draft updated.`);
      }
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not save draft."));
    }
    finally {
      setIsSaving(false);
    }
  };

  const clearDraftSource = async () => {
    if (!selectedSource) {
      setGovernanceDraft(buildGovernanceDraft(undefined));
      setTemplateDrafts(buildTemplateDrafts());
      setSelectedUploadFile(null);
      setSelectedUploadStatus("idle");
      setStoredDraftSourceId("");
      setLastSavedDraftFingerprint("");
      setStatusMessage("Form cleared.");
      return;
    }

    const sourceId = getKnowledgeSourceId(selectedSource);
    setIsSaving(true);

    try {
      await deleteKnowledgeSource(sourceId);
      setSources(currentSources =>
        currentSources.filter(item => getKnowledgeSourceId(item) !== sourceId),
      );
      setSelectedSourceId("");
      setIsCreateOpen(false);
      setStoredDraftSourceId("");
      setLastSavedDraftFingerprint("");
      setStatusMessage("Draft deleted.");
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Could not delete draft."));
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleIngestSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);
    if (!sourceId) {
      return;
    }

    try {
      const result = await ingestKnowledgeSource(sourceId, {
        localFilePath: source.localFilePath,
        metadata: source.metadata,
      });
      const nextSource = result.source ?? source;
      setSources(currentSources => upsertSource(currentSources, nextSource));
      setStatusMessage(`${nextSource.title} ingested successfully.`);
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
      setStatusMessage(`${nextSource.title} reindexed successfully.`);
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

    setIsSaving(true);
    try {
      const result = await refreshKnowledgeSource(sourceId, {
        metadata: { refreshRequestedFrom: "admin_dashboard" },
      });
      const nextSource = result.source ?? source;
      setSources(currentSources => upsertSource(currentSources, nextSource));
      setStatusMessage(`${nextSource.title} refresh complete.`);
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
      return;
    }
    const sourceId = getKnowledgeSourceId(selectedSource);
    setIsSaving(true);
    setSelectedUploadStatus("uploading");

    try {
      const result = await uploadKnowledgeSourceDocument(
        sourceId,
        selectedUploadFile,
        { ingestImmediately: true },
      );
      const nextSource = result.source ?? selectedSource;
      setSources(currentSources => upsertSource(currentSources, nextSource));
      setSelectedUploadStatus(result.error ? "failed" : "indexed");
      setStatusMessage(`${nextSource.title} uploaded and indexed.`);
    }
    catch (error) {
      setSelectedUploadStatus("failed");
      setStatusMessage(getFriendlyError(error, "Upload failed."));
    }
    finally {
      setIsSaving(false);
    }
  };

  const toggleLegalReview = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);
    try {
      const updated = await updateKnowledgeSource(sourceId, {
        legalReviewed: !source.legalReviewed,
      });
      setSources(currentSources => upsertSource(currentSources, updated));
      setStatusMessage(`Legal review status updated for ${updated.title}.`);
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Update failed."));
    }
  };

  const handleRejectSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);
    try {
      const rejected = await rejectKnowledgeSource(
        sourceId,
        "Rejected from the admin knowledge-source queue.",
      );
      setSources(currentSources => upsertSource(currentSources, rejected));
      setStatusMessage(`${rejected.title} rejected.`);
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Rejection failed."));
    }
  };

  const handleDeleteSource = async (source: KnowledgeSourceItem) => {
    const sourceId = getKnowledgeSourceId(source);
    try {
      await deleteKnowledgeSource(sourceId);
      setSources(currentSources =>
        currentSources.filter(item => getKnowledgeSourceId(item) !== sourceId),
      );
      setStatusMessage(`${source.title} deleted.`);
    }
    catch (error) {
      setStatusMessage(getFriendlyError(error, "Deletion failed."));
    }
  };

  return (
    <AdminContentManagementShell>
      <div className="w-full min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {isCreateOpen ? "Source Registration & Editor" : "Knowledge Sources Dashboard"}
            </h3>
            {statusMessage && (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border shadow-sm transition-all duration-300",
                  getStatusBannerClass(statusMessage),
                )}
              >
                {getStatusIcon(statusMessage)}
                <span>{statusMessage}</span>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="ml-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCreateOpen ? (
              <button
                type="button"
                onClick={() => {
                  closeCreateSourceForm("Returned to knowledge sources.");
                }}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 text-xs font-bold text-slate-700 transition shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void loadSources()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 text-xs font-bold text-slate-700 transition shadow-sm disabled:opacity-50"
                >
                  <RefreshCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                  Refresh Feed
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={openCreateSourceForm}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 px-4 text-xs font-bold text-white transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add New Source
                </button>
              </>
            )}
          </div>
        </div>

        <datalist id="knowledge-source-license-options">
          {LICENSE_STATUS_OPTIONS.map(option => (
            <option key={option} value={option} />
          ))}
        </datalist>

        {!isCreateOpen ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Refresh</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{queueStats.needsRefresh}</h3>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 border border-amber-100/50">
                    <RefreshCcw className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-[10px] text-slate-500">
                  <span className="font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mr-1.5">Needs action</span>
                  <span>sources require data sync</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stale Excluded</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{queueStats.staleExcluded}</h3>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 border border-rose-100/50">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-[10px] text-slate-500">
                  <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mr-1.5">Excluded</span>
                  <span>stale records off RAG pipeline</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Legal Review</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{queueStats.needsLegalReview}</h3>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600 border border-violet-100/50">
                    <Scale className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-[10px] text-slate-500">
                  <span className="font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded mr-1.5">Pending</span>
                  <span>sources require legal check</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ready Approval</span>
                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{queueStats.readyForApproval}</h3>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100/50">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-[10px] text-slate-500">
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mr-1.5">Ready</span>
                  <span>completed ingestion queue</span>
                </div>
              </div>
            </div>

            {readiness && (
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Public Legal RAG Readiness</span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm border",
                          getReadinessBadgeClass(readiness.summary.readinessStatus),
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            getReadinessDotClass(readiness.summary.readinessStatus),
                          )}
                        />
                        {displayReadinessStatus(readiness)}
                      </span>
                      <span className="text-sm font-semibold text-slate-600">
                        {`${readiness.summary.eligibleLegalSources} eligible legal source${readiness.summary.eligibleLegalSources === 1 ? "" : "s"} / ${readiness.summary.totalOfficialSources} official sources`}
                      </span>
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-auto">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Citation Ready</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-700">{readiness.summary.eligibleCitationSources}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Approved Current</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-700">{readiness.summary.approvedCurrentSources}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Blocked</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-700">{readiness.summary.blockedSources}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Metadata Only</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-700">{readiness.summary.metadataOnlySources}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className={cn(
                    "rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md",
                    readiness.configuration.openAiApiKeyConfigured
                      ? "bg-emerald-50/30 border-emerald-100 text-emerald-800"
                      : "bg-amber-50/30 border-amber-100 text-amber-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-bold uppercase tracking-wider">OpenAI Embeddings</p>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      {readiness.configuration.openAiApiKeyConfigured
                        ? `Configured: ${readiness.configuration.embeddingModel}`
                        : "OPENAI_API_KEY is missing"}
                    </p>
                  </div>

                  <div className={cn(
                    "rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md",
                    readiness.configuration.vectorIndex.status === "ready"
                      ? "bg-emerald-50/30 border-emerald-100 text-emerald-800"
                      : "bg-amber-50/30 border-amber-100 text-amber-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-bold uppercase tracking-wider">Vector Index</p>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-600 truncate" title={formatVectorIndexLabel(readiness)}>
                      {formatVectorIndexLabel(readiness)}
                    </p>
                  </div>

                  <div className={cn(
                    "rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md",
                    readiness.configuration.retrievalReady
                      ? "bg-emerald-50/30 border-emerald-100 text-emerald-800"
                      : "bg-amber-50/30 border-amber-100 text-amber-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-bold uppercase tracking-wider">Retrieval Config</p>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-600 truncate">
                      {readiness.configuration.retrievalReady
                        ? "Ready for live retrieval"
                        : readiness.configuration.vectorIndex.message}
                    </p>
                  </div>

                  <div className={cn(
                    "rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md",
                    Boolean(pineconeHealth?.configured && pineconeHealth.reachable)
                      ? "bg-emerald-50/30 border-emerald-100 text-emerald-800"
                      : "bg-amber-50/30 border-amber-100 text-amber-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-bold uppercase tracking-wider">Pinecone DB</p>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-600 truncate" title={pineconeHealth ? pineconeHealth.indexName : ""}>
                      {pineconeHealth
                        ? pineconeHealth.configured
                          ? `${pineconeHealth.reachable ? "Reachable" : "Not reachable"}: ${pineconeHealth.indexName ?? "unset"}`
                          : "Disabled: PINECONE_API_KEY missing"
                        : "Health not loaded"}
                    </p>
                  </div>
                </div>

                {readiness.blockers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 items-center border-t border-slate-50 pt-4">
                    <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                      Active Blockers:
                    </span>
                    {readiness.blockers.slice(0, 6).map(blocker => (
                      <span
                        key={blocker.code}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800"
                        title={blocker.sourceTitles.slice(0, 4).join(", ")}
                      >
                        {`${blocker.label} (${blocker.count})`}
                      </span>
                    ))}
                  </div>
                )}

                {priorityCoverageGaps.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-4 w-4 text-slate-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority RAG Coverage Cells</h4>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                      <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            <th className="px-4 py-2.5 font-semibold">Coverage Cell (Category / Jurisdiction / Topic)</th>
                            <th className="px-4 py-2.5 font-semibold">Eligible Sources</th>
                            <th className="px-4 py-2.5 font-semibold text-amber-600">Needs Legal</th>
                            <th className="px-4 py-2.5 font-semibold text-amber-600">Needs Refresh</th>
                            <th className="px-4 py-2.5 font-semibold text-rose-600">No Chunks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {priorityCoverageGaps.map(cell => (
                            <tr
                              key={`${cell.sourceCategory}-${cell.jurisdiction}-${cell.topic}`}
                              className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-4 py-2.5 font-semibold text-slate-800">
                                {`${displaySourceCategoryLabel(cell.sourceCategory)} / ${cell.jurisdiction} / ${cell.topic}`}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 font-medium">
                                {`${cell.eligibleSources}/${cell.totalSources}`}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">
                                <span className={cell.needsLegalReviewSources > 0 ? "text-amber-700 font-semibold" : ""}>{cell.needsLegalReviewSources}</span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">
                                <span className={cell.needsRefreshSources > 0 ? "text-amber-700 font-semibold" : ""}>{cell.needsRefreshSources}</span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">
                                <span className={cell.noChunkSources > 0 ? "text-rose-700 font-semibold" : ""}>{cell.noChunkSources}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full min-w-full border-collapse text-left lg:min-w-[900px] text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <th className="px-4 py-3.5 font-bold">Source Name</th>
                    <th className="px-4 py-3.5 font-bold">Category</th>
                    <th className="px-4 py-3.5 font-bold">Jurisdiction</th>
                    <th className="px-4 py-3.5 font-bold">Ingestion</th>
                    <th className="px-4 py-3.5 font-bold">Legal Status</th>
                    <th className="px-4 py-3.5 font-bold">Approval Status</th>
                    <th className="px-4 py-3.5 font-bold">Last Ingested</th>
                    <th className="px-4 py-3.5 font-bold">Chunks</th>
                    <th className="px-4 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCcw className="h-6 w-6 animate-spin text-primary" />
                          <span>Loading knowledge sources...</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && sources.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Database className="h-8 w-8 text-slate-300" />
                          <span>No knowledge sources have been added yet.</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && sources.map((row) => {
                    const sourceId = getKnowledgeSourceId(row);
                    const category = displayCategory(row);
                    const adminIngestionStatus = getAdminIngestionStatus(row);
                    const approvalBlockReason = getApprovalBlockReason(row);
                    const ragReady = isRagFullyReady(row);
                    const chunkCount = getChunkCount(row);

                    return (
                      <tr
                        key={sourceId}
                        className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer"
                        onClick={() => {
                          setIsCreateOpen(true);
                          setSelectedSourceId(sourceId);
                          setStatusMessage(`Editing details and templates for: ${row.title}`);
                        }}
                      >
                        <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-[220px]">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-primary transition-colors" />
                            <span className="truncate" title={row.title}>{row.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border",
                              getCategoryBadgeClass(category),
                            )}
                          >
                            {category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">
                          {row.jurisdiction}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                                getIngestionStatusBadgeClass(adminIngestionStatus),
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  getIngestionStatusDotClass(adminIngestionStatus),
                                )}
                              />
                              {adminIngestionStatus}
                            </span>
                            <p
                              className={cn(
                                "max-w-[190px] text-[9px] font-semibold ml-1 leading-relaxed",
                                ragReady ? "text-emerald-600" : "text-slate-500",
                              )}
                            >
                              {getExtractionConfidenceLabel(row)}
                            </p>
                            {getIndexingProgressLabel(row) && (
                              <p className="text-[9px] font-medium text-slate-400 ml-1">
                                {getIndexingProgressLabel(row)}
                              </p>
                            )}
                            {(row.ingestionStatus === "failed" || row.ingestionStatus === "partial_index_failed") && row.ingestionError && (
                              <p className="max-w-[150px] truncate text-[9px] font-semibold text-rose-600 ml-1" title={row.ingestionError}>
                                {row.ingestionError}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium">
                          <span className={`inline-flex items-center gap-1 ${
                            row.legalReviewed ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {row.legalReviewed ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            {row.legalReviewed ? "Reviewed" : "Requires Review"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">
                          <div className="space-y-1">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                                getApprovalStatusBadgeClass(row.status),
                              )}
                            >
                              {row.status}
                            </span>
                            <p className={cn("text-[9px] font-semibold", ragReady ? "text-emerald-600" : "text-slate-400")}>
                              {ragReady ? "Live RAG is active" : row.status === "approved" ? "Approved, but check ingestion readiness" : "Not live for AI yet"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">
                          {formatDate(row.ingestedAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <p className={cn("font-bold", chunkCount > 0 ? "text-slate-700" : "text-slate-400")}>
                              {chunkCount}
                            </p>
                            <p className={cn("text-[9px] font-semibold", chunkCount > 0 ? "text-emerald-600" : "text-slate-400")}>
                              {getChunkSummaryLabel(row)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreateOpen(true);
                                setSelectedSourceId(sourceId);
                                setStatusMessage(`Editing details for: ${row.title}`);
                              }}
                              className="rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition px-3 py-1.5 text-[11px] font-bold text-slate-700"
                            >
                              Edit Details
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(activeDropdownId === sourceId ? null : sourceId);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              {activeDropdownId === sourceId && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setActiveDropdownId(null)}
                                  />
                                  <div className="absolute right-0 mt-1.5 w-48 origin-top-right rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg z-40 text-left">
                                    <div className="px-3 py-1 border-b border-slate-50 mb-1">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pipeline Actions</p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={isSaving || !hasStoredContent(row)}
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        void handleIngestSource(row);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent font-medium flex items-center gap-1.5"
                                    >
                                      <Database className="h-3.5 w-3.5 text-slate-400" />
                                      Ingest Source
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSaving || getChunkCount(row) <= 0}
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        void handleReindexSource(row);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent font-medium flex items-center gap-1.5"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                                      Reindex chunks
                                    </button>
                                    {isOfficialSource(row) && (
                                      <button
                                        type="button"
                                        disabled={isSaving || !row.url || row.status === "archived" || row.status === "expired"}
                                        onClick={() => {
                                          setActiveDropdownId(null);
                                          void handleRefreshSource(row);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent font-medium flex items-center gap-1.5"
                                      >
                                        <RefreshCcw className="h-3.5 w-3.5 text-slate-400" />
                                        Fetch Refresh
                                      </button>
                                    )}
                                    <div className="h-[1px] bg-slate-50 my-1" />
                                    <div className="px-3 py-1 mb-1">
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Governance</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        void toggleLegalReview(row);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1.5"
                                    >
                                      <Scale className="h-3.5 w-3.5 text-slate-400" />
                                      {row.legalReviewed ? "Revoke Legal OK" : "Mark Legal OK"}
                                    </button>
                                    {row.status !== "approved" && (
                                      <button
                                        type="button"
                                        disabled={Boolean(approvalBlockReason)}
                                        onClick={() => {
                                          setActiveDropdownId(null);
                                          void approveKnowledgeSource(sourceId)
                                            .then((approvedSource) => {
                                              setSources(currentSources => upsertSource(currentSources, approvedSource));
                                              setStatusMessage(`${approvedSource.title} approved.`);
                                            })
                                            .catch((error: unknown) => {
                                              setStatusMessage(getFriendlyError(error, "Could not approve source."));
                                            });
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent font-medium flex items-center gap-1.5"
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        Approve for RAG
                                      </button>
                                    )}
                                    {row.status !== "rejected" && row.status !== "archived" && row.status !== "expired" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDropdownId(null);
                                          void handleRejectSource(row);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-amber-700 hover:bg-amber-50 font-medium flex items-center gap-1.5"
                                      >
                                        <X className="h-3.5 w-3.5 text-amber-500" />
                                        Reject Source
                                      </button>
                                    )}
                                    <div className="h-[1px] bg-slate-50 my-1" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        void handleDeleteSource(row);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1.5"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                      Delete Source
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50/50 to-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    {selectedSource ? "Source Registry Governance & Editing" : "Register New Knowledge Source"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-2xl">
                    {selectedSource 
                      ? `Modify registry details, refresh documentation, or re-draft the answer templates for "${selectedSource.title}".`
                      : "Provide registry metadata, upload document source files, and configure automated pipeline indexing rules."
                    }
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                    selectedSource 
                      ? "bg-blue-50 border-blue-100 text-blue-700" 
                      : "bg-amber-50 border-amber-100 text-amber-700"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedSource ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`} />
                    {selectedSource ? "Active Source" : "New Source Draft"}
                  </span>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void saveDraftSource()}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-bold text-slate-700 transition shadow-sm"
                  >
                    {isSaving
                      ? "Saving..."
                      : isSavedDraftRecord
                        ? isDraftDirty
                          ? "Update Draft"
                          : "Saved"
                        : "Save Draft"}
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void clearDraftSource()}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/30 hover:bg-rose-50 px-3 text-xs font-bold text-rose-700 transition"
                  >
                    Clear Form
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Registry Details</h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Title</span>
                    <input
                      type="text"
                      value={governanceDraft.title ?? ""}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          title: event.target.value,
                        }))}
                      placeholder="e.g. Domestic Violence Prevention Act 1989"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Source Category</span>
                    <div className="relative">
                      <select
                        value={
                          SOURCE_CATEGORY_OPTIONS.some(opt => opt.value === governanceDraft.sourceCategory)
                            ? governanceDraft.sourceCategory
                            : "official_support_source"
                        }
                        disabled={!isRegistryEditable}
                        onChange={(event) =>
                          setGovernanceDraft(current => ({
                            ...current,
                            sourceCategory: event.target.value as KnowledgeSourceCategory,
                          }))}
                        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-10 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        {SOURCE_CATEGORY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Publisher</span>
                    <input
                      type="text"
                      value={governanceDraft.publisher ?? ""}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          publisher: event.target.value,
                        }))}
                      placeholder="e.g. Attorney-General's Department"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">License Status</span>
                    <input
                      type="text"
                      list="knowledge-source-license-options"
                      value={governanceDraft.licenseStatus ?? ""}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          licenseStatus: event.target.value,
                        }))}
                      placeholder="Select or type license type"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Jurisdiction</span>
                    <div className="relative">
                      <select
                        value={
                          JURISDICTION_OPTIONS.includes(governanceDraft.jurisdiction)
                            ? governanceDraft.jurisdiction
                            : "AU"
                        }
                        disabled={!isRegistryEditable}
                        onChange={(event) =>
                          setGovernanceDraft(current => ({
                            ...current,
                            jurisdiction: event.target.value as KnowledgeSourceJurisdiction,
                          }))}
                        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-10 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        {JURISDICTION_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Topic Area</span>
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={
                            TOPIC_OPTIONS.includes(governanceDraft.topic) && governanceDraft.topic !== "other"
                              ? governanceDraft.topic
                              : "other"
                          }
                          disabled={!isRegistryEditable}
                          onChange={(event) => {
                            const val = event.target.value;
                            setGovernanceDraft(current => ({
                              ...current,
                              topic: val as KnowledgeSourceTopic,
                            }));
                          }}
                          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-10 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          {TOPIC_OPTIONS.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value="other">Other (Specify...)</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      {isRegistryEditable && (!TOPIC_OPTIONS.includes(governanceDraft.topic) || governanceDraft.topic === "other") && (
                        <input
                          type="text"
                          placeholder="Specify custom topic area"
                          value={governanceDraft.customTopic ?? ""}
                          onChange={event =>
                            setGovernanceDraft(current => ({
                              ...current,
                              customTopic: event.target.value,
                            }))}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                        />
                      )}
                    </div>
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Source Type</span>
                    <div className="relative">
                      <select
                        value={
                          SOURCE_TYPE_OPTIONS.includes(governanceDraft.sourceType)
                            ? governanceDraft.sourceType
                            : "Guideline"
                        }
                        disabled={!isRegistryEditable}
                        onChange={(event) =>
                          setGovernanceDraft(current => ({
                            ...current,
                            sourceType: event.target.value as KnowledgeSourceType,
                          }))}
                        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-10 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        {SOURCE_TYPE_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Language</span>
                    <input
                      type="text"
                      value={governanceDraft.language ?? "en"}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          language: event.target.value,
                        }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>
                </div>

                <div className="h-[1px] bg-slate-100 my-4" />

                <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-2 pt-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dates & Resource Link</h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Last Updated</span>
                    <input
                      type="date"
                      value={governanceDraft.lastUpdated ?? ""}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          lastUpdated: event.target.value,
                        }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Refresh Date</span>
                    <input
                      type="date"
                      value={governanceDraft.nextRefreshAt ?? ""}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          nextRefreshAt: event.target.value,
                        }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Review Due</span>
                    <input
                      type="date"
                      value={governanceDraft.nextReviewAt ?? ""}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          nextReviewAt: event.target.value,
                        }))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </label>
                </div>

                <label className="space-y-1 block pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                    Source Authority URL
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </span>
                  <input
                    type="url"
                    value={governanceDraft.url ?? ""}
                    disabled={!isRegistryEditable}
                    onChange={event =>
                      setGovernanceDraft(current => ({
                        ...current,
                        url: event.target.value,
                      }))}
                    placeholder="https://legislation.gov.au/details/..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </label>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-1">
                    <CloudUpload className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Document</h4>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]",
                      isDragging
                        ? "border-primary bg-blue-50/50"
                        : "border-slate-200 bg-slate-50/30 hover:border-primary/40 hover:bg-slate-50/50"
                    )}
                  >
                    <FileUp className="h-8 w-8 text-slate-400 mb-2.5" />
                    <p className="text-xs font-bold text-slate-700">Drag & drop source document</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                      Supports PDF, DOCX, TXT, MD, HTML, CSV, JSON (max 50MB)
                    </p>

                    <label className="mt-3 inline-flex h-7 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-3 text-[11px] font-bold text-slate-700 transition shadow-sm cursor-pointer">
                      Browse Files
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md,.html,.htm,.csv,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html,text/csv,application/json"
                        className="hidden"
                        disabled={!isRegistryEditable}
                        onChange={(event) => {
                          setSelectedUploadFile(event.target.files?.[0] ?? null);
                          setSelectedUploadStatus(event.target.files?.[0] ? "selected" : "idle");
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {selectedUploadFile ? (
                    <div className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/20 p-3.5">
                      <div className="flex items-start gap-2.5">
                        <FileText className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={selectedUploadFile.name}>
                            {selectedUploadFile.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {`${formatFileSize(selectedUploadFile.size)} · ${selectedUploadFile.type || "binary"}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUploadFile(null);
                            setSelectedUploadStatus("idle");
                          }}
                          className="rounded-md p-1 hover:bg-emerald-100/50 text-slate-400 hover:text-rose-500 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2 border-t border-emerald-100/30 pt-2">
                        <p className="text-[10px] text-slate-500 font-medium">
                          {selectedUploadStatus === "uploading" ? (
                            <span className="flex items-center gap-1.5 text-blue-600">
                              <RefreshCcw className="h-3 w-3 animate-spin text-blue-500" />
                              Uploading document file...
                            </span>
                          ) : selectedUploadStatus === "indexed" ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <Check className="h-3 w-3 text-emerald-500" />
                              Uploaded and indexed
                            </span>
                          ) : selectedUploadStatus === "failed" ? (
                            <span className="flex items-center gap-1 text-rose-600 font-semibold">
                              <X className="h-3 w-3 text-rose-500" />
                              Upload failed. Please retry.
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">
                              File selected
                            </span>
                          )}
                        </p>

                        {selectedUploadStatus === "selected" && (
                          <button
                            type="button"
                            onClick={() => void handleUploadDocumentForSelectedSource()}
                            className="inline-flex h-6 items-center justify-center rounded bg-emerald-600 hover:bg-emerald-700 text-white px-3 text-[10px] font-bold transition shadow-sm"
                          >
                            Upload & Ingest
                          </button>
                        )}
                      </div>
                    </div>
                  ) : persistedUploadedFile ? (
                    <div className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/30 p-3.5">
                      <div className="flex items-start gap-2.5">
                        <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-bold text-slate-800 truncate"
                            title={persistedUploadedFile.originalFileName ?? "Uploaded document"}
                          >
                            {persistedUploadedFile.originalFileName ?? "Uploaded document"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {`${formatFileSize(persistedUploadedFile.fileSizeBytes)} · ${persistedUploadedFile.mimeType || "binary"}`}
                          </p>
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2 border-t border-blue-100/50 pt-2">
                        <p className="text-[10px] font-medium">
                          {persistedUploadStatus?.tone === "indexed" ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <Check className="h-3 w-3 text-emerald-500" />
                              {persistedUploadStatus.label}
                            </span>
                          ) : persistedUploadStatus?.tone === "pending" ? (
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <Clock3 className="h-3 w-3 text-amber-500" />
                              {persistedUploadStatus.label}
                            </span>
                          ) : persistedUploadStatus?.tone === "failed" ? (
                            <span className="flex items-center gap-1 text-rose-600 font-semibold">
                              <X className="h-3 w-3 text-rose-500" />
                              {persistedUploadStatus.label}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-blue-600 font-semibold">
                              <Check className="h-3 w-3 text-blue-500" />
                              {persistedUploadStatus?.label ?? "Uploaded document saved"}
                            </span>
                          )}
                        </p>

                        {persistedUploadedFile.uploadedAt ? (
                          <span className="text-[10px] text-slate-400">
                            {`Saved ${new Date(persistedUploadedFile.uploadedAt).toLocaleDateString()}`}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {selectedSource
                          ? "No document uploaded for this RAG source."
                          : "No file selected."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-1">
                    <Scale className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Legal Governance</h4>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Review Notes</span>
                    <textarea
                      rows={3}
                      value={governanceDraft.reviewNotes ?? ""}
                      disabled={!isRegistryEditable}
                      onChange={event =>
                        setGovernanceDraft(current => ({
                          ...current,
                          reviewNotes: event.target.value,
                        }))}
                      placeholder="Add compliance notes, jurisdictional scope restrictions, or review details..."
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none disabled:bg-slate-50 disabled:text-slate-400 leading-normal"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-4 pt-1.5">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(governanceDraft.legalReviewed)}
                        disabled={!isRegistryEditable}
                        onChange={event =>
                          setGovernanceDraft(current => ({
                            ...current,
                            legalReviewed: event.target.checked,
                          }))}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
                      />
                      Legal review complete
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={!isRegistryEditable || isSaving}
                onClick={() => void saveGovernanceDetails()}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary hover:bg-primary/95 text-white px-5 text-sm font-bold transition shadow-sm disabled:opacity-50"
              >
                Save Registry Details
              </button>
              <button
                type="button"
                disabled={!isRegistryEditable || isSaving}
                onClick={() => void saveGovernanceDetails(true)}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 text-sm font-bold transition shadow-sm disabled:opacity-50"
              >
                Save & Approve for RAG
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-2 border-b border-slate-50 pb-4 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-5 text-primary" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Explanation Template Editor
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedSource
                      ? `Drafting response messages for: "${selectedSource.title}"`
                      : "Configure response wording that will ship with this new knowledge record."}
                  </p>

                  <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 mt-2.5">
                    {TEMPLATE_TABS.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTemplateTab(tab.id)}
                        className={cn(
                          "w-full rounded-lg py-2 text-xs font-bold leading-5 transition-all duration-200",
                          tab.id === activeTemplateTab
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:bg-white/40 hover:text-slate-800",
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <span className="mr-1.5 flex items-center gap-1 shrink-0">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Variables:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => insertVariable("{User_Name}")}
                    className="rounded bg-blue-50 border border-blue-100 hover:bg-blue-100 px-2 py-1 text-blue-700 transition"
                  >
                    User Name
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("{Scam_Type}")}
                    className="rounded bg-rose-50 border border-rose-100 hover:bg-rose-100 px-2 py-1 text-rose-700 transition"
                  >
                    Scam Type
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("{Risk_Level}")}
                    className="rounded bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-2 py-1 text-emerald-700 transition"
                  >
                    Risk Level
                  </button>
                  <span className="ml-auto lowercase font-normal italic text-slate-400 hidden sm:inline">Click to insert at cursor</span>
                </div>

                <textarea
                  id="template-textarea"
                  rows={9}
                  value={templateDraft}
                  onChange={event =>
                    setTemplateDrafts(current => ({
                      ...current,
                      [activeTemplateTab]: event.target.value,
                    }))}
                  disabled={!selectedSource && !isCreateOpen}
                  placeholder={
                    TEMPLATE_TABS.find(tab => tab.id === activeTemplateTab)?.placeholder
                    ?? "Add template text."
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3 mb-4">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">RAG Publishing Pipeline</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Understand the lifecycle status and requirements necessary to publish this source document into the live vector retrieval context.
                  </p>

                  <div className="relative mt-6 space-y-6 pl-4 border-l border-slate-100">
                    {/* Stepper Step 1 */}
                    <div className="relative">
                      <div className={cn(
                        "absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm transition-colors",
                        selectedSource
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white border-slate-200 text-slate-500 ring-2 ring-primary/10",
                      )}>
                        {selectedSource ? (
                          <Check className="h-3 w-3" />
                        ) : "1"}
                      </div>
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", selectedSource ? "text-slate-800" : "text-slate-400")}>
                          1. Setup Registry
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Registry details and legal metadata saved in context.
                        </p>
                      </div>
                    </div>

                    {/* Stepper Step 2 */}
                    <div className="relative">
                      <div className={cn(
                        "absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm transition-colors",
                        selectedSource && (getAdminIngestionStatus(selectedSource) === "indexed" || getChunkCount(selectedSource) > 0)
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : selectedSource
                          ? "bg-white border-slate-300 text-slate-700 ring-2 ring-primary/10"
                          : "bg-white border-slate-200 text-slate-400",
                      )}>
                        {selectedSource && (getAdminIngestionStatus(selectedSource) === "indexed" || getChunkCount(selectedSource) > 0) ? (
                          <Check className="h-3 w-3" />
                        ) : "2"}
                      </div>
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", selectedSource && (getAdminIngestionStatus(selectedSource) === "indexed" || getChunkCount(selectedSource) > 0) ? "text-slate-800" : "text-slate-400")}>
                          2. Extract & Index
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Document uploaded, chunks indexed into the vector database.
                        </p>
                      </div>
                    </div>

                    {/* Stepper Step 3 */}
                    <div className="relative">
                      <div className={cn(
                        "absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm transition-colors",
                        selectedSource && selectedSource.legalReviewed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : selectedSource && (getAdminIngestionStatus(selectedSource) === "indexed" || getChunkCount(selectedSource) > 0)
                          ? "bg-white border-slate-300 text-slate-700 ring-2 ring-primary/10"
                          : "bg-white border-slate-200 text-slate-400",
                      )}>
                        {selectedSource && selectedSource.legalReviewed ? (
                          <Check className="h-3 w-3" />
                        ) : "3"}
                      </div>
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", selectedSource && selectedSource.legalReviewed ? "text-slate-800" : "text-slate-400")}>
                          3. Legal Compliance
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Administrator verifies legal guidelines and compliance flags.
                        </p>
                      </div>
                    </div>

                    {/* Stepper Step 4 */}
                    <div className="relative">
                      <div className={cn(
                        "absolute -left-[30px] flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm transition-colors",
                        selectedSource && selectedSource.status === "approved"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : selectedSource && selectedSource.legalReviewed
                          ? "bg-white border-slate-300 text-slate-700 ring-2 ring-primary/10"
                          : "bg-white border-slate-200 text-slate-400",
                      )}>
                        {selectedSource && selectedSource.status === "approved" ? (
                          <Check className="h-3 w-3" />
                        ) : "4"}
                      </div>
                      <div className="space-y-0.5">
                        <p className={cn("text-xs font-bold", selectedSource && selectedSource.status === "approved" ? "text-slate-800" : "text-slate-400")}>
                          4. Approve for RAG
                        </p>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Source approved, enabling real-time retrieval by AI agents.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-50 pt-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Phase</p>
                  <p className="text-xs font-extrabold text-slate-700 mt-1">
                    {selectedSource 
                      ? selectedSource.status === "approved"
                        ? "Pipeline Completed (Active)"
                        : !selectedSource.legalReviewed
                        ? "Awaiting Legal Compliance"
                        : "Awaiting Final Approval"
                      : "Awaiting Source Registration"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminContentManagementShell>
  );
}
