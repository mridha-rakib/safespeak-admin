import { adminApiRequest } from "@/lib/admin-auth";
import { getAiAgentApiBaseUrl, type ApiRequestOptions } from "@/lib/api";

function knowledgeApiRequest<TData>(
  path: string,
  options: Omit<ApiRequestOptions, "token"> = {},
) {
  return adminApiRequest<TData>(path, {
    ...options,
    baseUrl: getAiAgentApiBaseUrl(),
  });
}

export type KnowledgeSourceStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired"
  | "archived";

export type KnowledgeSourceCategory =
  | "internal_product_rule"
  | "official_legal_source"
  | "official_support_source"
  | "admin_content"
  | (string & {});

export type KnowledgeSourceJurisdiction =
  | "Cth"
  | "NSW"
  | "VIC"
  | "QLD"
  | "SA"
  | "WA"
  | "TAS"
  | "NT"
  | "ACT"
  | "AU"
  | "Global"
  | "Internal"
  | (string & {});

export type KnowledgeSourceTopic =
  | "discrimination"
  | "racial"
  | "racial_hatred"
  | "online_safety"
  | "scam"
  | "migrant"
  | "privacy"
  | "workplace"
  | "dv"
  | "evidence"
  | "support"
  | "safespeak_policy"
  | "consent"
  | "crisis"
  | "education"
  | "local_intelligence"
  | "smart_dialler"
  | "other"
  | (string & {});

export type KnowledgeSourceType =
  | "Act"
  | "Regulation"
  | "Guideline"
  | "Form"
  | "Decision"
  | "Report"
  | "Policy"
  | "ProductRequirement"
  | "SupportResource"
  | "FAQ"
  | "WebPage"
  | (string & {});

export type KnowledgeSourceMetadata = {
  adminCategory?: string;
  templates?: Record<string, string>;
  chunkCount?: number;
  uploadedFile?: {
    originalFileName?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    storageKey?: string;
    uploadedAt?: string;
  };
  ingestionPipeline?: {
    status?: string;
    extractor?: string;
    updatedAt?: string;
    error?: string;
  };
  detectedLegalType?: string;
  actName?: string;
  actNumber?: string;
  legislationType?: string;
  country?: string;
  state?: string;
  effectiveDate?: string;
  version?: string | number;
  detectedActNames?: string[];
  detectedSectionRefs?: string[];
  detectedConstitutionalMentions?: string[];
  detectedCourts?: string[];
  constitutionalBasis?: string;
  legislationTags?: string[];
  extractedPageCount?: number;
  extractionStatus?: string;
  processingStage?: string;
  processingError?: string;
  pineconeIndexedAt?: string;
  pineconeNamespace?: string;
  pineconeIndexName?: string;
  indexedChunkCount?: number;
  indexingError?: string;
  largeDocumentWarning?: string;
  searchableAt?: string;
  searchReadinessStatus?:
    | "not_indexed"
    | "indexing"
    | "indexed_pending_search"
    | "searchable"
    | "failed";
  [key: string]: unknown;
};

export type KnowledgeSourceActorRef =
  | string
  | {
    id?: string;
    _id?: string;
  };

export type KnowledgeSourceItem = {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  sourceCategory: KnowledgeSourceCategory;
  jurisdiction: KnowledgeSourceJurisdiction;
  sourceAuthority?: string;
  authority?: string;
  topic: KnowledgeSourceTopic;
  sourceType: KnowledgeSourceType;
  language: string;
  url?: string;
  localFilePath?: string;
  publisher: string;
  licenseStatus: string;
  lastUpdated?: string;
  sourceDate?: string;
  lastVerifiedAt?: string;
  nextReviewAt?: string;
  nextRefreshAt?: string;
  refreshCadence?: string;
  legalReviewed: boolean;
  legalReviewedBy?: KnowledgeSourceActorRef;
  legalReviewedAt?: string;
  reviewNotes?: string;
  status: KnowledgeSourceStatus;
  ingestionStatus?:
    | "metadata_only"
    | "fetched"
    | "chunked"
    | "embedded"
    | "partial_index_failed"
    | "failed";
  ingestionError?: string;
  sha256Hash?: string;
  version: number;
  rawText?: string;
  rawTextPreview?: string;
  rawTextLength?: number;
  hasStoredContent?: boolean;
  fetchedAt?: string;
  metadata?: KnowledgeSourceMetadata;
  createdBy?: KnowledgeSourceActorRef;
  approvedBy?: KnowledgeSourceActorRef;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  ingestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
};

export type KnowledgeSourceInput = {
  title: string;
  description?: string;
  sourceCategory: KnowledgeSourceCategory;
  jurisdiction: KnowledgeSourceJurisdiction;
  sourceAuthority?: string;
  authority?: string;
  topic: KnowledgeSourceTopic;
  sourceType: KnowledgeSourceType;
  language?: string;
  url?: string;
  localFilePath?: string;
  publisher: string;
  licenseStatus: string;
  lastUpdated?: string;
  sourceDate?: string;
  lastVerifiedAt?: string;
  nextReviewAt?: string;
  nextRefreshAt?: string;
  refreshCadence?: string;
  legalReviewed?: boolean;
  reviewNotes?: string;
  status?: KnowledgeSourceStatus;
  version?: number;
  metadata?: KnowledgeSourceMetadata;
};

export type KnowledgeSourceIngestInput = {
  content?: string;
  localFilePath?: string;
  expectedSha256?: string;
  metadata?: KnowledgeSourceMetadata;
};

export type KnowledgeSourceRefreshInput = KnowledgeSourceIngestInput & {
  nextRefreshAt?: string;
};

export type KnowledgeSourceChunkPreview = {
  id: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  citationLabel?: string;
  citationUrl?: string;
  sectionRef?: string;
  sectionNumber?: string;
  sectionHeading?: string;
  metadata?: KnowledgeSourceMetadata;
  createdAt?: string;
  updatedAt?: string;
};

export type KnowledgeSourceChunkPreviewPage = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  chunks: KnowledgeSourceChunkPreview[];
};

export type KnowledgeSourceReadinessStatus =
  | "ready"
  | "ready_with_gaps"
  | "not_ready";

export type KnowledgeSourceVectorIndexReadinessStatus =
  | "ready"
  | "missing"
  | "unavailable"
  | "error";

export type KnowledgeSourceVectorIndexReadiness = {
  status: KnowledgeSourceVectorIndexReadinessStatus;
  indexName: string;
  collectionName: string;
  embeddingField: "embedding";
  embeddingModel: string;
  expectedDimensions?: number;
  message: string;
  definition?: unknown;
};

export type KnowledgeSourceReadinessConfiguration = {
  openAiApiKeyConfigured: boolean;
  embeddingModel: string;
  vectorIndex: KnowledgeSourceVectorIndexReadiness;
  retrievalReady: boolean;
};

export type KnowledgeSourceReadinessCoverageCell = {
  sourceCategory: Extract<
    KnowledgeSourceCategory,
    "official_legal_source" | "official_support_source"
  >;
  jurisdiction: KnowledgeSourceJurisdiction;
  topic: KnowledgeSourceTopic;
  totalSources: number;
  eligibleSources: number;
  approvedSources: number;
  pendingReviewSources: number;
  needsLegalReviewSources: number;
  needsRefreshSources: number;
  metadataOnlySources: number;
  failedIngestionSources: number;
  noChunkSources: number;
};

export type KnowledgeSourceReadinessBlocker = {
  code:
    | "not_approved"
    | "legal_review_missing"
    | "refresh_due_or_missing"
    | "not_embedded"
    | "no_chunks"
    | "official_url_missing_or_unapproved"
    | "ingestion_failed"
    | "metadata_only_needs_text"
    | "openai_api_key_missing"
    | "vector_index_missing"
    | "vector_search_unavailable"
    | "vector_index_check_failed";
  label: string;
  count: number;
  sourceIds: string[];
  sourceTitles: string[];
};

export type KnowledgeSourceReadiness = {
  generatedAt: string;
  summary: {
    readinessStatus: KnowledgeSourceReadinessStatus;
    readyForPublicLegalRag: boolean;
    retrievalConfigurationReady: boolean;
    totalOfficialSources: number;
    eligibleCitationSources: number;
    eligibleLegalSources: number;
    approvedCurrentSources: number;
    legalReviewedSources: number;
    pendingReviewSources: number;
    expiredRefreshSources: number;
    metadataOnlySources: number;
    failedIngestionSources: number;
    blockedSources: number;
  };
  configuration: KnowledgeSourceReadinessConfiguration;
  coverage: KnowledgeSourceReadinessCoverageCell[];
  blockers: KnowledgeSourceReadinessBlocker[];
};

export type PineconeHealth = {
  configured: boolean;
  indexName?: string;
  namespace?: string;
  embeddingModel?: string;
  expectedDimension?: number;
  reachable: boolean;
  error?: string;
};

export function getKnowledgeSourceId(source: KnowledgeSourceItem): string {
  return source.id ?? source._id ?? "";
}

export async function listKnowledgeSources(): Promise<KnowledgeSourceItem[]> {
  const response = await knowledgeApiRequest<{ sources: KnowledgeSourceItem[] }>(
    "/rag/knowledge-sources",
  );

  return response.data.sources;
}

export async function getKnowledgeSourceReadiness(): Promise<KnowledgeSourceReadiness> {
  const response = await knowledgeApiRequest<{ readiness: KnowledgeSourceReadiness }>(
    "/rag/knowledge-sources/readiness",
  );

  return response.data.readiness;
}

export async function getPineconeHealth(): Promise<PineconeHealth> {
  const response = await knowledgeApiRequest<{ health: PineconeHealth }>(
    "/rag/admin/pinecone/health",
  );

  return response.data.health;
}

export async function createKnowledgeSource(
  input: KnowledgeSourceInput,
): Promise<KnowledgeSourceItem> {
  const response = await knowledgeApiRequest<{ source: KnowledgeSourceItem }>(
    "/rag/knowledge-sources",
    {
      method: "POST",
      body: input,
    },
  );

  return response.data.source;
}

export async function updateKnowledgeSource(
  id: string,
  input: Partial<KnowledgeSourceInput>,
): Promise<KnowledgeSourceItem> {
  const response = await knowledgeApiRequest<{ source: KnowledgeSourceItem }>(
    `/rag/knowledge-sources/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.source;
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  await knowledgeApiRequest<null>(`/rag/knowledge-sources/${id}`, {
    method: "DELETE",
  });
}

export async function listKnowledgeSourceChunks(
  id: string,
  options: { page?: number; limit?: number } = {},
): Promise<KnowledgeSourceChunkPreviewPage> {
  const searchParams = new URLSearchParams();

  if (typeof options.page === "number") {
    searchParams.set("page", String(options.page));
  }
  if (typeof options.limit === "number") {
    searchParams.set("limit", String(options.limit));
  }

  const response = await knowledgeApiRequest<KnowledgeSourceChunkPreviewPage>(
    `/rag/knowledge-sources/${id}/chunks${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`,
  );

  return response.data;
}

export async function approveKnowledgeSource(
  id: string,
): Promise<KnowledgeSourceItem> {
  const response = await knowledgeApiRequest<{ source: KnowledgeSourceItem }>(
    `/rag/knowledge-sources/${id}/approve`,
    {
      method: "POST",
    },
  );

  return response.data.source;
}

export async function rejectKnowledgeSource(
  id: string,
  reason: string,
): Promise<KnowledgeSourceItem> {
  const response = await knowledgeApiRequest<{ source: KnowledgeSourceItem }>(
    `/rag/knowledge-sources/${id}/reject`,
    {
      method: "POST",
      body: { reason },
    },
  );

  return response.data.source;
}

export async function ingestKnowledgeSource(
  id: string,
  input: KnowledgeSourceIngestInput,
): Promise<{
    source?: KnowledgeSourceItem;
    chunkCount?: number;
    sha256Hash?: string;
    extractedLegalMetadata?: Record<string, unknown>;
  }> {
  const response = await knowledgeApiRequest<{
    result: {
      source?: KnowledgeSourceItem;
      chunkCount?: number;
      sha256Hash?: string;
      extractedLegalMetadata?: Record<string, unknown>;
    };
  }>(`/rag/knowledge-sources/${id}/ingest`, {
    method: "POST",
    body: input,
  });

  return response.data.result;
}

export async function uploadKnowledgeSourceDocument(
  id: string,
  file: File,
  options: { ingestImmediately?: boolean } = {},
): Promise<{
    source?: KnowledgeSourceItem;
    uploadedFile?: KnowledgeSourceMetadata["uploadedFile"];
    chunkCount?: number;
    sha256Hash?: string;
    extractedLegalMetadata?: Record<string, unknown>;
    ingestionStatus?: KnowledgeSourceItem["ingestionStatus"];
    error?: string;
    message?: string;
  }> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "ingestImmediately",
    String(options.ingestImmediately ?? true),
  );

  const response = await knowledgeApiRequest<{
    result: {
      source?: KnowledgeSourceItem;
      uploadedFile?: KnowledgeSourceMetadata["uploadedFile"];
      chunkCount?: number;
      sha256Hash?: string;
      extractedLegalMetadata?: Record<string, unknown>;
      ingestionStatus?: KnowledgeSourceItem["ingestionStatus"];
      error?: string;
      message?: string;
    };
  }>(`/rag/knowledge-sources/${id}/document`, {
    method: "POST",
    body: formData,
  });

  return response.data.result;
}

export async function refreshKnowledgeSource(
  id: string,
  input: KnowledgeSourceRefreshInput = {},
): Promise<{
    source?: KnowledgeSourceItem;
    chunkCount?: number;
    sha256Hash?: string;
    metadataOnly?: boolean;
    ingestionStatus?: KnowledgeSourceItem["ingestionStatus"];
    message?: string;
    reviewStatus?: string;
  }> {
  const response = await knowledgeApiRequest<{
    result: {
      source?: KnowledgeSourceItem;
      chunkCount?: number;
      sha256Hash?: string;
      metadataOnly?: boolean;
      ingestionStatus?: KnowledgeSourceItem["ingestionStatus"];
      message?: string;
      reviewStatus?: string;
    };
  }>(`/rag/knowledge-sources/${id}/refresh`, {
    method: "POST",
    body: input,
  });

  return response.data.result;
}

export async function reindexKnowledgeSource(id: string): Promise<{
  source?: KnowledgeSourceItem;
  chunkCount?: number;
}> {
  const response = await knowledgeApiRequest<{
    result: {
      source?: KnowledgeSourceItem;
      chunkCount?: number;
    };
  }>(`/rag/knowledge-sources/${id}/reindex`, {
    method: "POST",
  });

  return response.data.result;
}
