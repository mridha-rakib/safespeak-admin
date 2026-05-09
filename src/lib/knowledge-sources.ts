import { adminApiRequest } from "@/lib/admin-auth";

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
  | "admin_content";

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
  | "Internal";

export type KnowledgeSourceTopic =
  | "discrimination"
  | "racial_hatred"
  | "online_safety"
  | "scam"
  | "privacy"
  | "workplace"
  | "dv"
  | "evidence"
  | "support"
  | "safespeak_policy"
  | "consent"
  | "crisis"
  | "education"
  | "other";

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
  | "WebPage";

export type KnowledgeSourceMetadata = {
  adminCategory?: string;
  templates?: Record<string, string>;
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
  topic: KnowledgeSourceTopic;
  sourceType: KnowledgeSourceType;
  language: string;
  url?: string;
  localFilePath?: string;
  publisher: string;
  licenseStatus: string;
  lastUpdated?: string;
  nextReviewAt?: string;
  legalReviewed: boolean;
  status: KnowledgeSourceStatus;
  sha256Hash?: string;
  version: number;
  rawText?: string;
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
  topic: KnowledgeSourceTopic;
  sourceType: KnowledgeSourceType;
  language?: string;
  url?: string;
  localFilePath?: string;
  publisher: string;
  licenseStatus: string;
  lastUpdated?: string;
  nextReviewAt?: string;
  legalReviewed?: boolean;
  status?: KnowledgeSourceStatus;
  version?: number;
  metadata?: KnowledgeSourceMetadata;
};

export function getKnowledgeSourceId(source: KnowledgeSourceItem): string {
  return source.id ?? source._id ?? "";
}

export async function listKnowledgeSources(): Promise<KnowledgeSourceItem[]> {
  const response = await adminApiRequest<{ sources: KnowledgeSourceItem[] }>("/rag/knowledge-sources");

  return response.data.sources;
}

export async function createKnowledgeSource(input: KnowledgeSourceInput): Promise<KnowledgeSourceItem> {
  const response = await adminApiRequest<{ source: KnowledgeSourceItem }>("/rag/knowledge-sources", {
    method: "POST",
    body: input,
  });

  return response.data.source;
}

export async function updateKnowledgeSource(
  id: string,
  input: Partial<KnowledgeSourceInput>,
): Promise<KnowledgeSourceItem> {
  const response = await adminApiRequest<{ source: KnowledgeSourceItem }>(`/rag/knowledge-sources/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.source;
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  await adminApiRequest<null>(`/rag/knowledge-sources/${id}`, {
    method: "DELETE",
  });
}

export async function approveKnowledgeSource(id: string): Promise<KnowledgeSourceItem> {
  const response = await adminApiRequest<{ source: KnowledgeSourceItem }>(`/rag/knowledge-sources/${id}/approve`, {
    method: "POST",
  });

  return response.data.source;
}

export async function rejectKnowledgeSource(id: string, reason: string): Promise<KnowledgeSourceItem> {
  const response = await adminApiRequest<{ source: KnowledgeSourceItem }>(`/rag/knowledge-sources/${id}/reject`, {
    method: "POST",
    body: { reason },
  });

  return response.data.source;
}
