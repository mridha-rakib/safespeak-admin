import { adminApiRequest } from "@/lib/admin-auth";

export type AdminDashboardSummary = {
  users: number;
  reports: number;
  knowledgeSources: number;
  openPrivacyRequests: number;
};

export type AdminManagedUser = {
  _id?: string;
  id?: string;
  email: string;
  fullName: string;
  role: string;
  status: "active" | "inactive" | "suspended" | "deleted";
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type AdminTaxonomyRecord = {
  _id: string;
  type: "incident_type" | "support_need" | "language" | "culture";
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDestinationRecord = {
  _id: string;
  type:
    | "police"
    | "anti_discrimination_agency"
    | "esafety"
    | "legal_aid"
    | "community_legal_centre"
    | "education_provider"
    | "workplace_channel"
    | "scamwatch"
    | "reportcyber"
    | "community_support_org";
  key: string;
  name: string;
  channel:
    | "api_oauth"
    | "api_mtls"
    | "secure_email_pgp"
    | "secure_email"
    | "manual_export_pdf"
    | "manual_export_json"
    | "booking_link";
  jurisdiction: string;
  languages: string[];
  endpoint?: string;
  contactEmail?: string;
  contactPhone?: string;
  minimumRequiredInfo: string[];
  anonymityOptions: string[];
  expectedNextSteps: string[];
  consentRequired: boolean;
  supportsAcknowledgement: boolean;
  isActive: boolean;
  metadata?: {
    requiredConsentFlags?: string[];
    incidentTypes?: string[];
    recommendationReason?: string;
    submissionTitleTemplate?: string;
    submissionSummaryTemplate?: string;
  } & Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminPrivacyRequestRecord = {
  _id: string;
  requestType: string;
  status: "pending" | "in_review" | "completed" | "rejected";
  notes?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  requesterEmail?: string;
};

export type AdminSubmissionTemplateRecord = {
  _id: string;
  key: string;
  name: string;
  destinationType: AdminDestinationRecord["type"];
  channel: AdminDestinationRecord["channel"];
  jurisdiction: string;
  titleTemplate: string;
  summaryTemplate: string;
  fieldMappings: Array<{
    source: string;
    target: string;
    required: boolean;
    transform?: string;
  }>;
  staticPayload?: Record<string, unknown>;
  acknowledgementMode: "manual" | "sync_reference" | "async_webhook";
  attachmentMode: "metadata_only" | "include_hashes" | "include_manifest";
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminReportDeliveryRecord = {
  _id: string;
  reportId: string;
  destinationId: string;
  templateId?: string;
  templateKey?: string;
  destinationKey: string;
  destinationType: AdminDestinationRecord["type"];
  destinationName: string;
  channel: AdminDestinationRecord["channel"];
  jurisdiction: string;
  status: string;
  anonymityMode: "identified" | "anonymous" | "pseudonymous";
  requiredConsentFlags: string[];
  expectedNextSteps: string[];
  deliveryArtifacts?: Array<Record<string, unknown>>;
  deliveryMessage?: string;
  deliveryMode?: "automated" | "manual" | "config_missing";
  deliveryConfigurationStatus?: "ready" | "manual_action" | "config_missing";
  deliveryConfigurationIssues?: string[];
  actuallySent?: boolean;
  externalReference?: string;
  hasExternalReference?: boolean;
  hasDeliveryArtifacts?: boolean;
  submittedAt?: string;
  lastAttemptAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminAuditLogRecord = {
  id?: string;
  actorType: string;
  actorId?: string;
  sessionId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipHashPresent: boolean;
  userAgentHashPresent: boolean;
  createdAt?: string;
};

export type AdminSupportServiceRecord = {
  _id: string;
  id?: string;
  key: string;
  name: string;
  type:
    | "counselling"
    | "legal_information"
    | "housing"
    | "financial"
    | "crisis"
    | "community"
    | "health"
    | "online_safety";
  description: string;
  cardImageUrl?: string;
  cardImageAlt?: string;
  cardIcon:
    | "scale"
    | "shield"
    | "phone"
    | "community"
    | "counselling"
    | "home"
    | "bell"
    | "sparkles";
  cardOverlayTone: "default" | "dark" | "blue" | "red" | "brown" | "purple";
  availabilityLabel: string;
  referralTitle: string;
  referralDescription: string;
  resourceType:
    | "emergency"
    | "police"
    | "government"
    | "legal"
    | "mental_health"
    | "domestic_violence_agency"
    | "workplace_body"
    | "anti_discrimination_body"
    | "council_support"
    | "evidence_guidance"
    | "safety_planning"
    | "scam_support"
    | "online_safety";
  issueTypes: Array<
    | "domestic_violence"
    | "workplace_bullying"
    | "racism_discrimination"
    | "online_abuse"
    | "scam_fraud"
    | "theft_property"
    | "harassment"
    | "mental_health_distress"
    | "general_support"
  >;
  safetyRiskLevels: Array<"low" | "medium" | "high" | "immediate" | "all">;
  ctaLabel: string;
  resourceLinks: Array<{ label: string; url: string }>;
  jurisdiction: string;
  regions: string[];
  languages: string[];
  eligibility: string[];
  bookingUrl?: string;
  websiteUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  crisis: boolean;
  informationOnly: boolean;
  priority: number;
  safetyNotes?: string;
  eligibilityNotes?: string;
  languageSupportNotes?: string;
  isPublished: boolean;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminWarmReferralRecord = {
  _id: string;
  serviceId: string;
  serviceName?: string;
  serviceType?: string;
  partnerKey?: string;
  contactPreference: "phone" | "email" | "in_app";
  safeContactMasked?: string;
  hasSafeContact?: boolean;
  minimalSummary?: {
    incidentSummary?: string;
    immediateSafetyConcerns?: string;
    preferredContactMethod?: string;
    interpreterPreference?: string;
    culturalContext?: string;
    informationOnlyDisclaimer?: boolean;
  };
  includedFields: string[];
  shareProfileContext: boolean;
  consentSnapshot?: {
    warm_referral: boolean;
    capturedAt: string;
  };
  status: "pending" | "accepted" | "completed" | "cancelled";
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminAnalyticsOverview = {
  totalReports?: number;
  byStatus?: Array<{ _id: string; count: number }>;
  bySeverity?: Array<{ _id: string; count: number }>;
  privacy?: {
    anonymisedOnly?: boolean;
    minimumCellSuppression?: number;
  };
};

export type AdminAnalyticsBucket = {
  _id: Record<string, string | null> | string | null;
  count: number;
};

export type AdminAnalyticsProtectedCount = {
  count?: number;
  suppressed: boolean;
  label: string;
  noiseApplied: boolean;
};

export type AdminAnalyticsProtectedBucket = AdminAnalyticsProtectedCount & {
  _id?: Record<string, string | null> | string | null;
};

export type AdminAnalyticsExport = {
  exportId: string;
  format: "json" | "csv";
  generatedAt: string;
  filters: AnalyticsQuery;
  privacy: {
    anonymisedOnly: boolean;
    consentedReportsOnly: boolean;
    rawReportsExposed: boolean;
    piiExposed: boolean;
    minimumCellSuppression: number;
    differentialPrivacy: {
      enabled: boolean;
      mechanism: string;
      epsilon: number;
      sensitivity: number;
      maxAbsoluteNoise: number;
      appliedTo: string[];
      lowCountCellsSuppressedBeforeNoise: boolean;
      negativeCountsClampedToZero: boolean;
    };
  };
  summary: {
    reports: AdminAnalyticsProtectedCount;
  };
  dimensions: Record<string, AdminAnalyticsProtectedBucket[]>;
  rows: Array<Record<string, unknown>>;
  contentType?: string;
  content?: string;
};

export type AdminPlatformHealthStatus = "ready" | "needs_config" | "blocked";

export type AdminPlatformHealthCheck = {
  id: string;
  label: string;
  category: "core" | "security" | "ai" | "knowledge" | "storage" | "delivery" | "analytics";
  status: AdminPlatformHealthStatus;
  owner: string;
  metric: string;
  summary: string;
  details: string[];
};

export type AdminPlatformHealthOverview = {
  generatedAt: string;
  overallStatus: AdminPlatformHealthStatus;
  service: {
    name: string;
    version: string;
    environment: string;
    apiPrefix: string;
    uptimeSeconds: number;
    uptimeLabel: string;
  };
  stats: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
  checks: AdminPlatformHealthCheck[];
  blockers: AdminPlatformHealthCheck[];
  warnings: AdminPlatformHealthCheck[];
  counts: Record<string, number>;
  configuration: Record<string, boolean | string>;
  footerNote: string;
};

type AnalyticsQuery = {
  from?: string;
  to?: string;
  jurisdiction?: string;
  language?: string;
};

function toQueryString(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const response = await adminApiRequest<{ dashboard: AdminDashboardSummary }>("/admin/dashboard");

  return response.data.dashboard;
}

export async function listAdminUsers(query: {
  role?: string;
  status?: string;
  search?: string;
  limit?: number;
} = {}): Promise<AdminManagedUser[]> {
  const response = await adminApiRequest<{ users: AdminManagedUser[] }>(
    `/admin/users${toQueryString(query)}`,
  );

  return response.data.users;
}

export async function updateAdminUser(
  id: string,
  input: Partial<Pick<AdminManagedUser, "fullName" | "role" | "status">>,
): Promise<AdminManagedUser> {
  const response = await adminApiRequest<{ user: AdminManagedUser }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.user;
}

export async function listAdminTaxonomies(query: {
  type?: AdminTaxonomyRecord["type"];
  isActive?: boolean;
} = {}): Promise<AdminTaxonomyRecord[]> {
  const response = await adminApiRequest<{ taxonomies: AdminTaxonomyRecord[] }>(
    `/admin/taxonomies${toQueryString(query)}`,
  );

  return response.data.taxonomies;
}

export async function getAdminTaxonomy(id: string): Promise<AdminTaxonomyRecord> {
  const response = await adminApiRequest<{ taxonomy: AdminTaxonomyRecord }>(`/admin/taxonomies/${id}`);

  return response.data.taxonomy;
}

export async function createAdminTaxonomy(
  input: Omit<AdminTaxonomyRecord, "_id">,
): Promise<AdminTaxonomyRecord> {
  const response = await adminApiRequest<{ taxonomy: AdminTaxonomyRecord }>("/admin/taxonomies", {
    method: "POST",
    body: input,
  });

  return response.data.taxonomy;
}

export async function patchAdminTaxonomy(
  id: string,
  input: Partial<Omit<AdminTaxonomyRecord, "_id">>,
): Promise<AdminTaxonomyRecord> {
  const response = await adminApiRequest<{ taxonomy: AdminTaxonomyRecord }>(`/admin/taxonomies/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.taxonomy;
}

export async function deleteAdminTaxonomy(id: string): Promise<void> {
  await adminApiRequest<{ taxonomy: AdminTaxonomyRecord }>(`/admin/taxonomies/${id}`, {
    method: "DELETE",
  });
}

export async function listAdminDestinations(query: {
  type?: AdminDestinationRecord["type"];
  channel?: AdminDestinationRecord["channel"];
  jurisdiction?: string;
  isActive?: boolean;
} = {}): Promise<AdminDestinationRecord[]> {
  const response = await adminApiRequest<{ destinations: AdminDestinationRecord[] }>(
    `/admin/destinations${toQueryString(query)}`,
  );

  return response.data.destinations;
}

export async function createAdminDestination(
  input: Omit<AdminDestinationRecord, "_id">,
): Promise<AdminDestinationRecord> {
  const response = await adminApiRequest<{ destination: AdminDestinationRecord }>("/admin/destinations", {
    method: "POST",
    body: input,
  });

  return response.data.destination;
}

export async function patchAdminDestination(
  id: string,
  input: Partial<Omit<AdminDestinationRecord, "_id">>,
): Promise<AdminDestinationRecord> {
  const response = await adminApiRequest<{ destination: AdminDestinationRecord }>(
    `/admin/destinations/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.destination;
}

export async function listAdminSubmissionTemplates(query: {
  destinationType?: AdminDestinationRecord["type"];
  channel?: AdminDestinationRecord["channel"];
  jurisdiction?: string;
  isActive?: boolean;
} = {}): Promise<AdminSubmissionTemplateRecord[]> {
  const response = await adminApiRequest<{ templates: AdminSubmissionTemplateRecord[] }>(
    `/admin/submission-templates${toQueryString(query)}`,
  );

  return response.data.templates;
}

export async function createAdminSubmissionTemplate(
  input: Omit<AdminSubmissionTemplateRecord, "_id">,
): Promise<AdminSubmissionTemplateRecord> {
  const response = await adminApiRequest<{ template: AdminSubmissionTemplateRecord }>(
    "/admin/submission-templates",
    {
      method: "POST",
      body: input,
    },
  );

  return response.data.template;
}

export async function patchAdminSubmissionTemplate(
  id: string,
  input: Partial<Omit<AdminSubmissionTemplateRecord, "_id">>,
): Promise<AdminSubmissionTemplateRecord> {
  const response = await adminApiRequest<{ template: AdminSubmissionTemplateRecord }>(
    `/admin/submission-templates/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.template;
}

export async function listAdminReportDeliveries(query: {
  status?: string;
  destinationType?: AdminDestinationRecord["type"];
  channel?: AdminDestinationRecord["channel"];
  limit?: number;
} = {}): Promise<AdminReportDeliveryRecord[]> {
  const response = await adminApiRequest<{ deliveries: AdminReportDeliveryRecord[] }>(
    `/admin/report-deliveries${toQueryString(query)}`,
  );

  return response.data.deliveries;
}

export async function listAdminAuditLogs(query: {
  actorType?: string;
  resourceType?: string;
  action?: string;
  actorId?: string;
  resourceId?: string;
  limit?: number;
} = {}): Promise<AdminAuditLogRecord[]> {
  const response = await adminApiRequest<{ auditLogs: AdminAuditLogRecord[] }>(
    `/admin/audit-logs${toQueryString(query)}`,
  );

  return response.data.auditLogs;
}

export async function listAdminSupportServices(query: {
  type?: AdminSupportServiceRecord["type"];
  resourceType?: AdminSupportServiceRecord["resourceType"];
  issueType?: AdminSupportServiceRecord["issueTypes"][number];
  jurisdiction?: string;
  language?: string;
  region?: string;
  eligibility?: string;
  profile?: string;
  isPublished?: boolean;
  isActive?: boolean;
} = {}): Promise<AdminSupportServiceRecord[]> {
  const response = await adminApiRequest<{ services: AdminSupportServiceRecord[] }>(
    `/admin/support-services${toQueryString(query)}`,
  );

  return response.data.services;
}

export async function createAdminSupportService(
  input: Omit<AdminSupportServiceRecord, "_id" | "id" | "createdAt" | "updatedAt">,
): Promise<AdminSupportServiceRecord> {
  const response = await adminApiRequest<{ service: AdminSupportServiceRecord }>(
    "/admin/support-services",
    {
      method: "POST",
      body: input,
    },
  );

  return response.data.service;
}

export async function patchAdminSupportService(
  id: string,
  input: Partial<Omit<AdminSupportServiceRecord, "_id" | "id" | "createdAt" | "updatedAt">>,
): Promise<AdminSupportServiceRecord> {
  const response = await adminApiRequest<{ service: AdminSupportServiceRecord }>(
    `/admin/support-services/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.service;
}

export async function deleteAdminSupportService(id: string): Promise<void> {
  await adminApiRequest<null>(`/admin/support-services/${id}`, {
    method: "DELETE",
  });
}

export async function listAdminWarmReferrals(query: {
  status?: AdminWarmReferralRecord["status"];
  serviceId?: string;
  limit?: number;
} = {}): Promise<AdminWarmReferralRecord[]> {
  const response = await adminApiRequest<{ referrals: AdminWarmReferralRecord[] }>(
    `/admin/support-services/warm-referrals${toQueryString(query)}`,
  );

  return response.data.referrals;
}

export async function patchAdminWarmReferral(
  id: string,
  input: { status: AdminWarmReferralRecord["status"]; notes?: string },
): Promise<AdminWarmReferralRecord> {
  const response = await adminApiRequest<{ referral: AdminWarmReferralRecord }>(
    `/admin/support-services/warm-referrals/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.referral;
}

export async function listAdminPrivacyRequests(query: {
  status?: AdminPrivacyRequestRecord["status"];
  limit?: number;
} = {}): Promise<AdminPrivacyRequestRecord[]> {
  const response = await adminApiRequest<{ privacyRequests: AdminPrivacyRequestRecord[] }>(
    `/admin/privacy-requests${toQueryString(query)}`,
  );

  return response.data.privacyRequests;
}

export async function patchAdminPrivacyRequest(
  id: string,
  input: Pick<AdminPrivacyRequestRecord, "status"> & { notes?: string },
): Promise<AdminPrivacyRequestRecord> {
  const response = await adminApiRequest<{ privacyRequest: AdminPrivacyRequestRecord }>(
    `/admin/privacy-requests/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.privacyRequest;
}

export async function getAdminPlatformHealthOverview(): Promise<AdminPlatformHealthOverview> {
  const response = await adminApiRequest<{ platformHealth: AdminPlatformHealthOverview }>("/admin/platform-health");

  return response.data.platformHealth;
}

export async function getAdminAnalyticsOverview(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsOverview> {
  const response = await adminApiRequest<{ overview: AdminAnalyticsOverview }>(
    `/admin/analytics/overview${toQueryString(query)}`,
  );

  return response.data.overview;
}

export async function getAdminAnalyticsHeatmap(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ heatmap: AdminAnalyticsBucket[] }>(
    `/admin/analytics/heatmap${toQueryString(query)}`,
  );

  return response.data.heatmap;
}

export async function getAdminAnalyticsTrends(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ trends: AdminAnalyticsBucket[] }>(
    `/admin/analytics/trends${toQueryString(query)}`,
  );

  return response.data.trends;
}

export async function getAdminAnalyticsCategories(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ categories: AdminAnalyticsBucket[] }>(
    `/admin/analytics/categories${toQueryString(query)}`,
  );

  return response.data.categories;
}

export async function getAdminAnalyticsLanguages(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ languages: AdminAnalyticsBucket[] }>(
    `/admin/analytics/languages${toQueryString(query)}`,
  );

  return response.data.languages;
}

export async function getAdminAnalyticsExport(
  query: AnalyticsQuery & { format?: "json" | "csv" } = {},
): Promise<AdminAnalyticsExport> {
  const response = await adminApiRequest<{ export: AdminAnalyticsExport }>(
    `/admin/analytics/export${toQueryString({ format: "json", ...query })}`,
  );

  return response.data.export;
}
