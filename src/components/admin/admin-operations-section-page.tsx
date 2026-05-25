import type { ReactNode } from "react";

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  AdminAnalyticsBucket,
  AdminAnalyticsExport,
  AdminAnalyticsOverview,
  AdminAuditLogRecord,
  AdminDestinationRecord,
  AdminPlatformHealthCheck,
  AdminPlatformHealthOverview,
  AdminPrivacyRequestRecord,
  AdminReportDeliveryRecord,
  AdminSubmissionTemplateRecord,
  AdminTaxonomyRecord,
} from "@/lib/admin-operations";

import {
  createAdminDestination,
  createAdminSubmissionTemplate,
  createAdminTaxonomy,
  deleteAdminTaxonomy,
  getAdminAnalyticsCategories,
  getAdminAnalyticsExport,
  getAdminAnalyticsHeatmap,
  getAdminAnalyticsLanguages,
  getAdminAnalyticsOverview,
  getAdminAnalyticsTrends,
  getAdminPlatformHealthOverview,
  getAdminTaxonomy,
  listAdminAuditLogs,
  listAdminDestinations,
  listAdminPrivacyRequests,
  listAdminReportDeliveries,
  listAdminSubmissionTemplates,
  listAdminTaxonomies,
  patchAdminDestination,
  patchAdminPrivacyRequest,
  patchAdminSubmissionTemplate,
  patchAdminTaxonomy,
} from "@/lib/admin-operations";
import { cn } from "@/lib/utils";

export type AdminOperationsQuickLink = {
  label: string;
  to: string;
  description: string;
};

export type AdminOperationsModule = {
  id: string;
  label: string;
  status: "Priority" | "Active" | "Monitored" | "Ready";
  summary: string;
  owner: string;
  cadence: string;
  metric: string;
  highlights: string[];
};

export type AdminOperationsStat = {
  label: string;
  value: string;
  helper: string;
};

export type AdminOperationsSectionConfig = {
  eyebrow: string;
  title: string;
  description: string;
  statusNote: string;
  stats: AdminOperationsStat[];
  modules: AdminOperationsModule[];
  quickLinks: AdminOperationsQuickLink[];
  watchlistTitle: string;
  watchlist: string[];
  footerNote?: ReactNode;
};

type AdminOperationsSectionKey =
  | "taxonomies"
  | "destinations"
  | "privacyRequests"
  | "deliveries"
  | "auditLogs"
  | "analytics"
  | "platformHealth";

type LivePanelState = {
  isLoading: boolean;
  error: string | null;
  taxonomies: AdminTaxonomyRecord[];
  destinations: AdminDestinationRecord[];
  submissionTemplates: AdminSubmissionTemplateRecord[];
  privacyRequests: AdminPrivacyRequestRecord[];
  deliveries: AdminReportDeliveryRecord[];
  auditLogs: AdminAuditLogRecord[];
  analyticsOverview: AdminAnalyticsOverview | null;
  analyticsHeatmap: AdminAnalyticsBucket[];
  analyticsTrends: AdminAnalyticsBucket[];
  analyticsCategories: AdminAnalyticsBucket[];
  analyticsLanguages: AdminAnalyticsBucket[];
  analyticsExport: AdminAnalyticsExport | null;
  platformHealth: AdminPlatformHealthOverview | null;
};

type DestinationDraft = {
  type: AdminDestinationRecord["type"];
  key: string;
  name: string;
  channel: AdminDestinationRecord["channel"];
  jurisdiction: string;
  languages: string;
  endpoint: string;
  contactEmail: string;
  contactPhone: string;
  minimumRequiredInfo: string;
  anonymityOptions: string;
  expectedNextSteps: string;
  requiredConsentFlags: string;
  incidentTypes: string;
  recommendationReason: string;
  submissionTitleTemplate: string;
  submissionSummaryTemplate: string;
  consentRequired: boolean;
  supportsAcknowledgement: boolean;
};

type SubmissionTemplateFieldMappingDraft = {
  id: string;
  source: string;
  target: string;
  required: boolean;
  transform: string;
};

type StaticPayloadEntryDraft = {
  id: string;
  key: string;
  value: string;
  valueType: "text" | "number" | "boolean";
};

type SubmissionTemplateDraft = Omit<
  AdminSubmissionTemplateRecord,
  "_id" | "fieldMappings" | "staticPayload" | "isActive" | "metadata"
> & {
  fieldMappings: SubmissionTemplateFieldMappingDraft[];
  staticPayloadEntries: StaticPayloadEntryDraft[];
  preservedStaticPayload: Record<string, unknown>;
};

const defaultFieldMappings = [
  { source: "refNo", target: "referenceId", required: true },
  { source: "incidentType", target: "category", required: true },
  { source: "summary", target: "description", required: true },
];

const templateVariableOptions = [
  { value: "refNo", label: "Reference No" },
  { value: "summary", label: "Summary" },
  { value: "incidentType", label: "Incident Type" },
  { value: "category", label: "Category" },
  { value: "safetyRisk", label: "Safety Risk" },
  { value: "jurisdiction", label: "Jurisdiction" },
  { value: "anonymityMode", label: "Anonymity Mode" },
  { value: "reporterContact", label: "Reporter Contact" },
  { value: "createdAt", label: "Created Date" },
];

const titleTemplatePresets = [
  { label: "Reference report", template: "SafeSpeak report {{refNo}}" },
  { label: "Incident report", template: "{{incidentType}} report {{refNo}}" },
  { label: "Jurisdiction report", template: "{{jurisdiction}} SafeSpeak report {{refNo}}" },
];

const summaryTemplatePresets = [
  { label: "Use summary only", template: "{{summary}}" },
  { label: "Summary with risk", template: "{{summary}}\nSafety risk: {{safetyRisk}}" },
  { label: "Full intake brief", template: "{{summary}}\nIncident type: {{incidentType}}\nJurisdiction: {{jurisdiction}}" },
];

const safeSpeakFieldOptions = [
  { value: "refNo", label: "Reference No" },
  { value: "incidentType", label: "Incident Type" },
  { value: "category", label: "Category" },
  { value: "summary", label: "Summary" },
  { value: "description", label: "Incident Description" },
  { value: "jurisdiction", label: "Jurisdiction" },
  { value: "language", label: "Language" },
  { value: "safetyRisk", label: "Safety Risk" },
  { value: "anonymityMode", label: "Anonymity Mode" },
  { value: "reporterContact", label: "Reporter Contact" },
  { value: "evidenceManifest", label: "Evidence Manifest" },
  { value: "consentFlags", label: "Consent Flags" },
  { value: "createdAt", label: "Created Date" },
];

const transformOptions = [
  { value: "", label: "No transform" },
  { value: "trim", label: "Trim spaces" },
  { value: "lowercase", label: "Lowercase" },
  { value: "uppercase", label: "Uppercase" },
  { value: "iso_date", label: "ISO date" },
  { value: "mask_contact", label: "Mask contact" },
];

function parseCommaSeparatedValues(value: string) {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function formatCommaSeparatedValues(value?: string[]) {
  return value?.join(", ") ?? "";
}

function getTemplateVariableLabel(token: string) {
  return templateVariableOptions.find(option => option.value === token)?.label ?? token;
}

function getSafeSpeakFieldLabel(field: string) {
  return safeSpeakFieldOptions.find(option => option.value === field)?.label ?? field;
}

function friendlyTemplateToStorage(value: string) {
  return value.replace(/\[([^\]]+)\]/g, (_match, label: string) => {
    const normalizedLabel = label.trim().toLowerCase();
    const option = templateVariableOptions.find(variable =>
      variable.label.toLowerCase() === normalizedLabel || variable.value.toLowerCase() === normalizedLabel,
    );

    return option ? `{{${option.value}}}` : `{{${label.trim()}}}`;
  });
}

function storageTemplateToFriendly(value: string) {
  return value.replace(/\{\{([^{}\r\n]+)\}\}/g, (_match, token: string) => {
    return `[${getTemplateVariableLabel(token.trim())}]`;
  });
}

function appendTemplateVariable(template: string, token: string) {
  const separator = template && !/\s$/.test(template) ? " " : "";

  return `${template}${separator}{{${token}}}`;
}

function createDraftRowId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createFieldMappingDraft(
  mapping?: Partial<AdminSubmissionTemplateRecord["fieldMappings"][number]>,
): SubmissionTemplateFieldMappingDraft {
  return {
    id: createDraftRowId("mapping"),
    source: mapping?.source ?? "",
    target: mapping?.target ?? "",
    required: Boolean(mapping?.required),
    transform: mapping?.transform ?? "",
  };
}

function createStaticPayloadEntryDraft(
  key = "",
  value: string | number | boolean = "",
): StaticPayloadEntryDraft {
  return {
    id: createDraftRowId("payload"),
    key,
    value: String(value),
    valueType:
      typeof value === "number"
        ? "number"
        : typeof value === "boolean"
          ? "boolean"
          : "text",
  };
}

function createDefaultFieldMappingDrafts() {
  return defaultFieldMappings.map(mapping => createFieldMappingDraft(mapping));
}

function splitStaticPayloadForDraft(payload?: Record<string, unknown>) {
  const staticPayloadEntries: StaticPayloadEntryDraft[] = [];
  const preservedStaticPayload: Record<string, unknown> = {};

  Object.entries(payload ?? {}).forEach(([key, value]) => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      staticPayloadEntries.push(createStaticPayloadEntryDraft(key, value));
      return;
    }

    preservedStaticPayload[key] = value;
  });

  return {
    preservedStaticPayload,
    staticPayloadEntries,
  };
}

function createDefaultDestinationDraft(): DestinationDraft {
  return {
    type: "police",
    key: "",
    name: "",
    channel: "secure_email",
    jurisdiction: "NSW",
    languages: "en",
    endpoint: "",
    contactEmail: "",
    contactPhone: "",
    minimumRequiredInfo: "",
    anonymityOptions: "",
    expectedNextSteps: "",
    requiredConsentFlags: "share_with_agencies",
    incidentTypes: "",
    recommendationReason: "",
    submissionTitleTemplate: "",
    submissionSummaryTemplate: "",
    consentRequired: true,
    supportsAcknowledgement: false,
  };
}

function createDefaultSubmissionTemplateDraft(): SubmissionTemplateDraft {
  return {
    key: "",
    name: "",
    destinationType: "police",
    channel: "secure_email",
    jurisdiction: "NSW",
    titleTemplate: "SafeSpeak report {{refNo}}",
    summaryTemplate: "{{summary}}",
    fieldMappings: createDefaultFieldMappingDrafts(),
    staticPayloadEntries: [],
    preservedStaticPayload: {},
    acknowledgementMode: "manual",
    attachmentMode: "metadata_only",
  };
}

function destinationToDraft(item: AdminDestinationRecord): DestinationDraft {
  return {
    type: item.type,
    key: item.key,
    name: item.name,
    channel: item.channel,
    jurisdiction: item.jurisdiction,
    languages: formatCommaSeparatedValues(item.languages),
    endpoint: item.endpoint ?? "",
    contactEmail: item.contactEmail ?? "",
    contactPhone: item.contactPhone ?? "",
    minimumRequiredInfo: formatCommaSeparatedValues(item.minimumRequiredInfo),
    anonymityOptions: formatCommaSeparatedValues(item.anonymityOptions),
    expectedNextSteps: formatCommaSeparatedValues(item.expectedNextSteps),
    requiredConsentFlags: formatCommaSeparatedValues(item.metadata?.requiredConsentFlags),
    incidentTypes: formatCommaSeparatedValues(item.metadata?.incidentTypes),
    recommendationReason: item.metadata?.recommendationReason ?? "",
    submissionTitleTemplate: item.metadata?.submissionTitleTemplate ?? "",
    submissionSummaryTemplate: item.metadata?.submissionSummaryTemplate ?? "",
    consentRequired: item.consentRequired,
    supportsAcknowledgement: item.supportsAcknowledgement,
  };
}

function templateToDraft(item: AdminSubmissionTemplateRecord): SubmissionTemplateDraft {
  const staticPayloadDraft = splitStaticPayloadForDraft(item.staticPayload);

  return {
    key: item.key,
    name: item.name,
    destinationType: item.destinationType,
    channel: item.channel,
    jurisdiction: item.jurisdiction,
    titleTemplate: item.titleTemplate,
    summaryTemplate: item.summaryTemplate,
    fieldMappings: (item.fieldMappings ?? []).map(mapping => createFieldMappingDraft(mapping)),
    staticPayloadEntries: staticPayloadDraft.staticPayloadEntries,
    preservedStaticPayload: staticPayloadDraft.preservedStaticPayload,
    acknowledgementMode: item.acknowledgementMode,
    attachmentMode: item.attachmentMode,
  };
}

function buildDestinationPayload(
  draft: DestinationDraft,
  existing?: AdminDestinationRecord,
): Omit<AdminDestinationRecord, "_id" | "createdAt" | "updatedAt"> {
  return {
    type: draft.type,
    key: draft.key.trim(),
    name: draft.name.trim(),
    channel: draft.channel,
    jurisdiction: draft.jurisdiction.trim(),
    languages: parseCommaSeparatedValues(draft.languages),
    endpoint: draft.endpoint.trim(),
    contactEmail: draft.contactEmail.trim(),
    contactPhone: draft.contactPhone.trim(),
    minimumRequiredInfo: parseCommaSeparatedValues(draft.minimumRequiredInfo),
    anonymityOptions: parseCommaSeparatedValues(draft.anonymityOptions),
    expectedNextSteps: parseCommaSeparatedValues(draft.expectedNextSteps),
    consentRequired: draft.consentRequired,
    supportsAcknowledgement: draft.supportsAcknowledgement,
    isActive: existing?.isActive ?? true,
    metadata: {
      ...(existing?.metadata ?? {}),
      requiredConsentFlags: parseCommaSeparatedValues(draft.requiredConsentFlags),
      incidentTypes: parseCommaSeparatedValues(draft.incidentTypes),
      recommendationReason: draft.recommendationReason.trim() || undefined,
      submissionTitleTemplate: draft.submissionTitleTemplate.trim() || undefined,
      submissionSummaryTemplate: draft.submissionSummaryTemplate.trim() || undefined,
    },
  };
}

function buildFieldMappingsFromDraft(
  mappings: SubmissionTemplateFieldMappingDraft[],
): AdminSubmissionTemplateRecord["fieldMappings"] {
  return mappings.flatMap((mapping) => {
    const source = mapping.source.trim();
    const target = mapping.target.trim() || source;
    const transform = mapping.transform.trim();

    if (!source && !target && !transform) {
      return [];
    }

    if (!source) {
      throw new TypeError("Each field mapping requires a source field.");
    }

    return [{
      source,
      target,
      required: mapping.required,
      ...(transform ? { transform } : {}),
    }];
  });
}

function buildStaticPayloadFromDraft(draft: SubmissionTemplateDraft) {
  const staticPayload: Record<string, unknown> = {
    ...draft.preservedStaticPayload,
  };

  draft.staticPayloadEntries.forEach((entry) => {
    const key = entry.key.trim();

    if (!key) {
      return;
    }

    if (entry.valueType === "number") {
      const numericValue = Number(entry.value);

      if (Number.isNaN(numericValue)) {
        throw new TypeError(`Static payload field "${key}" must be a valid number.`);
      }

      staticPayload[key] = numericValue;
      return;
    }

    if (entry.valueType === "boolean") {
      staticPayload[key] = ["true", "yes", "1"].includes(entry.value.trim().toLowerCase());
      return;
    }

    staticPayload[key] = entry.value;
  });

  return staticPayload;
}

function buildSubmissionTemplatePayload(
  draft: SubmissionTemplateDraft,
  existing?: AdminSubmissionTemplateRecord,
): Omit<AdminSubmissionTemplateRecord, "_id" | "createdAt" | "updatedAt"> {
  return {
    key: draft.key.trim(),
    name: draft.name.trim(),
    destinationType: draft.destinationType,
    channel: draft.channel,
    jurisdiction: draft.jurisdiction.trim(),
    titleTemplate: draft.titleTemplate.trim(),
    summaryTemplate: draft.summaryTemplate.trim(),
    fieldMappings: buildFieldMappingsFromDraft(draft.fieldMappings),
    staticPayload: buildStaticPayloadFromDraft(draft),
    acknowledgementMode: draft.acknowledgementMode,
    attachmentMode: draft.attachmentMode,
    isActive: existing?.isActive ?? true,
    metadata: existing?.metadata ?? {},
  };
}

function formatMetadataLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMetadataText(value: unknown): string {
  if (typeof value === "string") {
    return formatMetadataLabel(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length ? value.map(formatMetadataText).join(", ") : "None";
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    return entries.length
      ? entries.map(([key, entryValue]) => `${formatMetadataLabel(key)}: ${formatMetadataText(entryValue)}`).join("; ")
      : "None";
  }

  return "Not provided";
}

function normalizeMetadataKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function inferCultureProfileGroup(item: AdminTaxonomyRecord) {
  const key = normalizeMetadataKey(item.key);
  const label = item.label.trim().toLowerCase();

  if (key.startsWith("faith_") || ["buddhist", "christian", "hindu", "jewish", "muslim", "sikh"].includes(label)) {
    return "faith";
  }

  if (key.startsWith("community_") || key.includes("migrant") || key.includes("student") || key.includes("disability")) {
    return "community";
  }

  return "cultural";
}

function getGeneratedTaxonomyMetadata(item: AdminTaxonomyRecord): Record<string, unknown> {
  const metadata = item.metadata ?? {};

  if (Object.keys(metadata).length) {
    return metadata;
  }

  const generatedMetadata: Record<string, unknown> = {
    source: "admin_created",
    taxonomyType: item.type,
    normalizedKey: normalizeMetadataKey(item.key),
    hasDescription: Boolean(item.description?.trim()),
  };

  if (item.type === "incident_type") {
    return {
      ...generatedMetadata,
      usage: "report_classification",
      analyticsDimension: "incidentType",
    };
  }

  if (item.type === "support_need") {
    return {
      ...generatedMetadata,
      usage: "support_recommendation",
      analyticsDimension: "supportNeed",
    };
  }

  if (item.type === "language") {
    return {
      ...generatedMetadata,
      usage: "language_access",
      analyticsDimension: "language",
      region: "Custom",
      priority: "admin",
    };
  }

  return {
    ...generatedMetadata,
    usage: "profile_context",
    analyticsDimension: "profileContext",
    profileGroup: inferCultureProfileGroup(item),
  };
}

function getAdminErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";

  if (/duplicate key|E11000/i.test(message)) {
    return "This taxonomy key already exists for the selected type. Use a different key, or update the existing record.";
  }

  return message || fallback;
}

const defaultLivePanelState: LivePanelState = {
  isLoading: false,
  error: null,
  taxonomies: [],
  destinations: [],
  submissionTemplates: [],
  privacyRequests: [],
  deliveries: [],
  auditLogs: [],
  analyticsOverview: null,
  analyticsHeatmap: [],
  analyticsTrends: [],
  analyticsCategories: [],
  analyticsLanguages: [],
  analyticsExport: null,
  platformHealth: null,
};

async function fetchLivePanelData(sectionKey: AdminOperationsSectionKey): Promise<LivePanelState> {
  if (sectionKey === "taxonomies") {
    const taxonomies = await listAdminTaxonomies();

    return {
      ...defaultLivePanelState,
      taxonomies,
    };
  }

  if (sectionKey === "destinations") {
    const [destinations, submissionTemplates, deliveries] = await Promise.all([
      listAdminDestinations(),
      listAdminSubmissionTemplates(),
      listAdminReportDeliveries({ limit: 25 }),
    ]);

    return {
      ...defaultLivePanelState,
      destinations,
      submissionTemplates,
      deliveries,
    };
  }

  if (sectionKey === "privacyRequests") {
    const privacyRequests = await listAdminPrivacyRequests({ limit: 50 });

    return {
      ...defaultLivePanelState,
      privacyRequests,
    };
  }

  if (sectionKey === "deliveries") {
    const deliveries = await listAdminReportDeliveries({ limit: 25 });

    return {
      ...defaultLivePanelState,
      deliveries,
    };
  }

  if (sectionKey === "auditLogs") {
    const auditLogs = await listAdminAuditLogs({ limit: 50 });

    return {
      ...defaultLivePanelState,
      auditLogs,
    };
  }

  if (sectionKey === "platformHealth") {
    const platformHealth = await getAdminPlatformHealthOverview();

    return {
      ...defaultLivePanelState,
      platformHealth,
    };
  }

  const [
    analyticsOverview,
    analyticsHeatmap,
    analyticsTrends,
    analyticsCategories,
    analyticsLanguages,
  ] = await Promise.all([
    getAdminAnalyticsOverview(),
    getAdminAnalyticsHeatmap(),
    getAdminAnalyticsTrends(),
    getAdminAnalyticsCategories(),
    getAdminAnalyticsLanguages(),
  ]);

  return {
    ...defaultLivePanelState,
    analyticsOverview,
    analyticsHeatmap,
    analyticsTrends,
    analyticsCategories,
    analyticsLanguages,
  };
}

const taxonomyTypeByModuleId: Partial<Record<string, AdminTaxonomyRecord["type"]>> = {
  "incident-types": "incident_type",
  "destination-types": "support_need",
  "cultural-categories": "culture",
  "language-codes": "language",
};

function statusClass(status: AdminOperationsModule["status"]) {
  if (status === "Priority") {
    return "bg-[#FFF4E5] text-[#9A3412]";
  }

  if (status === "Active") {
    return "bg-[#E8F7EE] text-[#0F7A43]";
  }

  if (status === "Monitored") {
    return "bg-[#EEF6FF] text-[#0F67AE]";
  }

  return "bg-[#F1F5F9] text-[#334155]";
}

function platformHealthStatusClass(status: AdminPlatformHealthCheck["status"]) {
  if (status === "blocked") {
    return "bg-[#FFF1F0] text-[#B42318]";
  }

  if (status === "needs_config") {
    return "bg-[#FFF4E5] text-[#9A3412]";
  }

  return "bg-[#E8F7EE] text-[#0F7A43]";
}

function platformHealthStatusLabel(status: AdminPlatformHealthCheck["status"]) {
  if (status === "needs_config") {
    return "Needs config";
  }

  return status === "blocked" ? "Blocked" : "Ready";
}

function deliveryStatusClass(status: string) {
  if (status === "failed" || status === "config_missing") {
    return "bg-[#FFF1F0] text-[#B42318]";
  }

  if (status === "requires_manual_action") {
    return "bg-[#FFF4E5] text-[#9A3412]";
  }

  if (status === "submitted" || status === "acknowledged") {
    return "bg-[#E8F7EE] text-[#0F7A43]";
  }

  return "bg-[#EEF6FF] text-[#0F67AE]";
}

function deliveryStatusLabel(status: string) {
  if (status === "config_missing") {
    return "Config missing";
  }

  if (status === "requires_manual_action") {
    return "Manual action";
  }

  return status.replace(/_/g, " ");
}

function deliveryReadinessLabel(item: AdminReportDeliveryRecord) {
  if (item.deliveryConfigurationStatus === "config_missing") {
    return "Missing configuration";
  }

  if (item.deliveryConfigurationStatus === "manual_action") {
    return "Manual handoff";
  }

  if (item.deliveryConfigurationStatus === "ready") {
    return item.actuallySent ? "Sent externally" : "Ready";
  }

  return item.actuallySent ? "Sent externally" : "Not sent";
}

function getLivePanelDescription(sectionKey: AdminOperationsSectionKey) {
  if (sectionKey === "taxonomies") {
    return "Manage active incident, support, language, and culture taxonomy records.";
  }

  if (sectionKey === "destinations") {
    return "Review live destination routing records for agencies and services.";
  }

  if (sectionKey === "privacyRequests") {
    return "Update privacy request review state from the live backend queue.";
  }

  if (sectionKey === "deliveries") {
    return "Monitor consent-gated delivery attempts without exposing raw payloads.";
  }

  if (sectionKey === "auditLogs") {
    return "Review masked admin audit records without raw PII, IP hashes, or user-agent hashes.";
  }

  if (sectionKey === "platformHealth") {
    return "Review live system readiness, integration configuration, and operational blockers without exposing secrets.";
  }

  return "Review anonymised analytics aggregates returned by the backend analytics module.";
}

export function AdminOperationsSectionPage({
  config,
  sectionKey,
  onRefreshConfig,
}: {
  config: AdminOperationsSectionConfig;
  sectionKey?: AdminOperationsSectionKey;
  onRefreshConfig?: () => Promise<void>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFocus = searchParams.get("focus");
  const activeModule = config.modules.find(module => module.id === requestedFocus) ?? config.modules[0];
  const [livePanel, setLivePanel] = useState<LivePanelState>(defaultLivePanelState);
  const [taxonomyDraft, setTaxonomyDraft] = useState({
    type: "incident_type" as AdminTaxonomyRecord["type"],
    key: "",
    label: "",
    description: "",
  });
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<AdminTaxonomyRecord | null>(null);
  const [destinationDraft, setDestinationDraft] = useState<DestinationDraft>(() => createDefaultDestinationDraft());
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
  const [destinationSearchQuery, setDestinationSearchQuery] = useState("");
  const [destinationTypeFilter, setDestinationTypeFilter] = useState<AdminDestinationRecord["type"] | "all">("all");
  const [destinationChannelFilter, setDestinationChannelFilter] = useState<AdminDestinationRecord["channel"] | "all">("all");
  const [submissionTemplateDraft, setSubmissionTemplateDraft] = useState<SubmissionTemplateDraft>(() =>
    createDefaultSubmissionTemplateDraft(),
  );
  const [editingSubmissionTemplateId, setEditingSubmissionTemplateId] = useState<string | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isSubmittingLiveChange, setIsSubmittingLiveChange] = useState(false);

  const setActiveModule = (moduleId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("focus", moduleId);
    setSearchParams(nextSearchParams, { replace: true });
  };

  useEffect(() => {
    if (sectionKey !== "taxonomies") {
      return;
    }

    const nextType = taxonomyTypeByModuleId[activeModule.id];

    if (!nextType) {
      return;
    }

    setTaxonomyDraft(prev => (prev.type === nextType ? prev : { ...prev, type: nextType }));
    setSelectedTaxonomy(null);
  }, [activeModule.id, sectionKey]);

  useEffect(() => {
    if (!sectionKey) {
      setLivePanel(defaultLivePanelState);
      return;
    }

    let isMounted = true;
    setLivePanel(prev => ({ ...prev, isLoading: true, error: null }));

    const load = async () => {
      const nextLivePanel = await fetchLivePanelData(sectionKey);

      if (isMounted) {
        setLivePanel({
          ...nextLivePanel,
          isLoading: false,
        });
      }
    };

    void load().catch((error: unknown) => {
      if (!isMounted) {
        return;
      }

      setLivePanel(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unable to load admin data.",
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [sectionKey]);

  const refreshLivePanel = async () => {
    if (!sectionKey && !onRefreshConfig) {
      return;
    }

    setLivePanel(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const nextLivePanel = sectionKey ? await fetchLivePanelData(sectionKey) : defaultLivePanelState;

      if (onRefreshConfig) {
        await onRefreshConfig();
      }

      setLivePanel({
        ...nextLivePanel,
        isLoading: false,
      });
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unable to load admin data.",
      }));
    }
  };

  const generateProtectedAnalyticsExport = async () => {
    if (sectionKey !== "analytics") {
      return;
    }

    setIsSubmittingLiveChange(true);
    setLivePanel(prev => ({ ...prev, error: null }));

    try {
      const analyticsExport = await getAdminAnalyticsExport({ format: "json" });

      setLivePanel(prev => ({
        ...prev,
        analyticsExport,
      }));
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to generate protected analytics export.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const visibleTaxonomies = useMemo(
    () => livePanel.taxonomies.filter(item => item.type === taxonomyDraft.type),
    [livePanel.taxonomies, taxonomyDraft.type],
  );
  const visibleDestinations = useMemo(() => {
    const query = destinationSearchQuery.trim().toLowerCase();

    return livePanel.destinations.filter((item) => {
      const matchesQuery = !query
        || [
          item.name,
          item.key,
          item.type,
          item.channel,
          item.jurisdiction,
          item.endpoint ?? "",
          item.contactEmail ?? "",
          item.contactPhone ?? "",
          item.metadata?.recommendationReason ?? "",
        ].join(" ").toLowerCase().includes(query);

      const matchesType = destinationTypeFilter === "all" || item.type === destinationTypeFilter;
      const matchesChannel = destinationChannelFilter === "all" || item.channel === destinationChannelFilter;

      return matchesQuery && matchesType && matchesChannel;
    });
  }, [destinationChannelFilter, destinationSearchQuery, destinationTypeFilter, livePanel.destinations]);
  const visibleSubmissionTemplates = useMemo(() => {
    const query = templateSearchQuery.trim().toLowerCase();

    return livePanel.submissionTemplates.filter((item) => {
      if (!query) {
        return true;
      }

      return [
        item.name,
        item.key,
        item.destinationType,
        item.channel,
        item.jurisdiction,
        item.titleTemplate,
        item.summaryTemplate,
      ].join(" ").toLowerCase().includes(query);
    });
  }, [livePanel.submissionTemplates, templateSearchQuery]);
  const selectedTaxonomyMetadata = useMemo(
    () => (selectedTaxonomy ? getGeneratedTaxonomyMetadata(selectedTaxonomy) : {}),
    [selectedTaxonomy],
  );

  const handleTaxonomyCreate = async () => {
    setIsSubmittingLiveChange(true);

    try {
      const taxonomy = await createAdminTaxonomy({
        type: taxonomyDraft.type,
        key: taxonomyDraft.key,
        label: taxonomyDraft.label,
        description: taxonomyDraft.description || undefined,
        isActive: true,
        metadata: {},
      });

      setLivePanel(prev => ({
        ...prev,
        taxonomies: [taxonomy, ...prev.taxonomies],
        error: null,
      }));
      setSelectedTaxonomy(taxonomy);
      setTaxonomyDraft({
        type: taxonomy.type,
        key: "",
        label: "",
        description: "",
      });
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: getAdminErrorMessage(error, "Unable to create taxonomy."),
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const handleDestinationCreate = async () => {
    setIsSubmittingLiveChange(true);

    try {
      const existingDestination = editingDestinationId
        ? livePanel.destinations.find(item => item._id === editingDestinationId)
        : undefined;
      const payload = buildDestinationPayload(destinationDraft, existingDestination);
      const destination = editingDestinationId
        ? await patchAdminDestination(editingDestinationId, payload)
        : await createAdminDestination(payload);

      setLivePanel(prev => ({
        ...prev,
        destinations: editingDestinationId
          ? prev.destinations.map(row => (row._id === destination._id ? destination : row))
          : [destination, ...prev.destinations],
        error: null,
      }));
      setDestinationDraft(createDefaultDestinationDraft());
      setEditingDestinationId(null);
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to save destination.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const handleSubmissionTemplateCreate = async () => {
    setIsSubmittingLiveChange(true);

    try {
      const existingTemplate = editingSubmissionTemplateId
        ? livePanel.submissionTemplates.find(item => item._id === editingSubmissionTemplateId)
        : undefined;
      const payload = buildSubmissionTemplatePayload(submissionTemplateDraft, existingTemplate);
      const template = editingSubmissionTemplateId
        ? await patchAdminSubmissionTemplate(editingSubmissionTemplateId, payload)
        : await createAdminSubmissionTemplate(payload);

      setLivePanel(prev => ({
        ...prev,
        submissionTemplates: editingSubmissionTemplateId
          ? prev.submissionTemplates.map(row => (row._id === template._id ? template : row))
          : [template, ...prev.submissionTemplates],
        error: null,
      }));
      setSubmissionTemplateDraft(createDefaultSubmissionTemplateDraft());
      setEditingSubmissionTemplateId(null);
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to save submission template.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const toggleTaxonomyActive = async (item: AdminTaxonomyRecord) => {
    setIsSubmittingLiveChange(true);

    try {
      const taxonomy = await patchAdminTaxonomy(item._id, { isActive: !item.isActive });
      setLivePanel(prev => ({
        ...prev,
        taxonomies: prev.taxonomies.map(row => (row._id === item._id ? taxonomy : row)),
        error: null,
      }));
      setSelectedTaxonomy(prev => (prev?._id === item._id ? taxonomy : prev));
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to update taxonomy.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const handleTaxonomyView = async (item: AdminTaxonomyRecord) => {
    if (selectedTaxonomy?._id === item._id) {
      setSelectedTaxonomy(null);
      return;
    }

    setIsSubmittingLiveChange(true);

    try {
      const taxonomy = await getAdminTaxonomy(item._id);
      setSelectedTaxonomy(taxonomy);
      setLivePanel(prev => ({
        ...prev,
        taxonomies: prev.taxonomies.map(row => (row._id === item._id ? taxonomy : row)),
        error: null,
      }));
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to load taxonomy details.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const handleTaxonomyDelete = async (item: AdminTaxonomyRecord) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Delete "${item.label}" from taxonomies?`);

    if (!confirmed) {
      return;
    }

    setIsSubmittingLiveChange(true);

    try {
      await deleteAdminTaxonomy(item._id);
      setLivePanel(prev => ({
        ...prev,
        taxonomies: prev.taxonomies.filter(row => row._id !== item._id),
        error: null,
      }));
      setSelectedTaxonomy(prev => (prev?._id === item._id ? null : prev));
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to delete taxonomy.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const startDestinationEdit = (item: AdminDestinationRecord) => {
    setDestinationDraft(destinationToDraft(item));
    setEditingDestinationId(item._id);
    setLivePanel(prev => ({ ...prev, error: null }));
  };

  const cancelDestinationEdit = () => {
    setDestinationDraft(createDefaultDestinationDraft());
    setEditingDestinationId(null);
  };

  const toggleDestinationActive = async (item: AdminDestinationRecord) => {
    setIsSubmittingLiveChange(true);

    try {
      const destination = await patchAdminDestination(item._id, { isActive: !item.isActive });
      setLivePanel(prev => ({
        ...prev,
        destinations: prev.destinations.map(row => (row._id === item._id ? destination : row)),
        error: null,
      }));
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to update destination.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const startSubmissionTemplateEdit = (item: AdminSubmissionTemplateRecord) => {
    setSubmissionTemplateDraft(templateToDraft(item));
    setEditingSubmissionTemplateId(item._id);
    setLivePanel(prev => ({ ...prev, error: null }));
  };

  const cancelSubmissionTemplateEdit = () => {
    setSubmissionTemplateDraft(createDefaultSubmissionTemplateDraft());
    setEditingSubmissionTemplateId(null);
  };

  const addSubmissionTemplateFieldMapping = () => {
    setSubmissionTemplateDraft(prev => ({
      ...prev,
      fieldMappings: [...prev.fieldMappings, createFieldMappingDraft()],
    }));
  };

  const updateSubmissionTemplateFieldMapping = (
    id: string,
    updates: Partial<Omit<SubmissionTemplateFieldMappingDraft, "id">>,
  ) => {
    setSubmissionTemplateDraft(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map(mapping =>
        mapping.id === id ? { ...mapping, ...updates } : mapping,
      ),
    }));
  };

  const removeSubmissionTemplateFieldMapping = (id: string) => {
    setSubmissionTemplateDraft(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.filter(mapping => mapping.id !== id),
    }));
  };

  const addStaticPayloadEntry = () => {
    setSubmissionTemplateDraft(prev => ({
      ...prev,
      staticPayloadEntries: [...prev.staticPayloadEntries, createStaticPayloadEntryDraft()],
    }));
  };

  const updateStaticPayloadEntry = (
    id: string,
    updates: Partial<Omit<StaticPayloadEntryDraft, "id">>,
  ) => {
    setSubmissionTemplateDraft(prev => ({
      ...prev,
      staticPayloadEntries: prev.staticPayloadEntries.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry,
      ),
    }));
  };

  const removeStaticPayloadEntry = (id: string) => {
    setSubmissionTemplateDraft(prev => ({
      ...prev,
      staticPayloadEntries: prev.staticPayloadEntries.filter(entry => entry.id !== id),
    }));
  };

  const toggleSubmissionTemplateActive = async (item: AdminSubmissionTemplateRecord) => {
    setIsSubmittingLiveChange(true);

    try {
      const template = await patchAdminSubmissionTemplate(item._id, { isActive: !item.isActive });
      setLivePanel(prev => ({
        ...prev,
        submissionTemplates: prev.submissionTemplates.map(row => (row._id === item._id ? template : row)),
        error: null,
      }));
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to update submission template.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const updatePrivacyStatus = async (
    item: AdminPrivacyRequestRecord,
    status: AdminPrivacyRequestRecord["status"],
  ) => {
    setIsSubmittingLiveChange(true);

    try {
      const privacyRequest = await patchAdminPrivacyRequest(item._id, { status });
      setLivePanel(prev => ({
        ...prev,
        privacyRequests: prev.privacyRequests.map(row => (row._id === item._id ? privacyRequest : row)),
        error: null,
      }));
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to update privacy request.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#607B90]">{config.eyebrow}</p>
            <div className="space-y-1">
              <h2 className="text-[28px] font-semibold leading-none text-[#1E293B] sm:text-[32px]">{config.title}</h2>
              <p className="max-w-3xl text-sm leading-6 text-[#607B90]">{config.description}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#D6E3F0] bg-[#F7FBFF] px-3 py-2 text-[12px] font-semibold text-[#0F67AE]">
            <span className="h-2 w-2 rounded-full bg-[#0F67AE]" />
            {config.statusNote}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {config.stats.map(stat => (
            <article
              key={stat.label}
              className="rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3"
            >
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">{stat.label}</p>
              <p className="mt-2 text-[30px] font-semibold leading-none text-[#1E293B]">{stat.value}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#607B90]">{stat.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <aside className="rounded-xl border border-[#CAD7E3] bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <div className="mb-3">
            <h3 className="text-[18px] font-semibold text-[#1E293B]">Controls In Scope</h3>
            <p className="mt-1 text-[12px] text-[#607B90]">Each control below is active and shareable through the `focus` query param.</p>
          </div>

          <div className="space-y-2">
            {config.modules.map(module => (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]",
                  activeModule.id === module.id
                    ? "border-[#0F67AE] bg-[#EEF6FF]"
                    : "border-[#D8E3EE] bg-white hover:bg-[#F8FBFF]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[#1E293B]">{module.label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(module.status)}`}>
                    {module.status}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#607B90]">{module.summary}</p>
              </button>
            ))}
          </div>
        </aside>

        <article className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-3 border-b border-[#E5ECF3] pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[24px] font-semibold leading-none text-[#1E293B]">{activeModule.label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(activeModule.status)}`}>
                  {activeModule.status}
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-[#607B90]">{activeModule.summary}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveModule(activeModule.id);
                void refreshLivePanel();
              }}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-4 text-[13px] font-semibold text-[#0F67AE] transition hover:bg-[#F3F8FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              Refresh Data
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3">
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">OWNER</p>
              <p className="mt-2 text-[15px] font-semibold text-[#1E293B]">{activeModule.owner}</p>
            </div>
            <div className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3">
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">REVIEW CADENCE</p>
              <p className="mt-2 text-[15px] font-semibold text-[#1E293B]">{activeModule.cadence}</p>
            </div>
            <div className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3">
              <p className="text-[10px] font-bold tracking-wide text-[#607B90]">SUCCESS SIGNAL</p>
              <p className="mt-2 text-[15px] font-semibold text-[#1E293B]">{activeModule.metric}</p>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-[16px] font-semibold text-[#1E293B]">Implementation Details</h4>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {activeModule.highlights.map(highlight => (
                <li
                  key={highlight}
                  className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3 text-[13px] leading-6 text-[#475569]"
                >
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {sectionKey
            ? (
                <div className="mt-5 rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] p-4">
                  <div className="flex flex-col gap-2 border-b border-[#E5ECF3] pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-[16px] font-semibold text-[#1E293B]">Live Admin Data</h4>
                      <p className="mt-1 text-[12px] text-[#607B90]">
                        {getLivePanelDescription(sectionKey)}
                      </p>
                    </div>
                    {livePanel.isLoading
                      ? <span className="text-[12px] font-semibold text-[#0F67AE]">Loading...</span>
                      : null}
                  </div>

                  {livePanel.error
                    ? (
                        <div className="mt-3 rounded-lg border border-[#F4C7C3] bg-[#FFF7F6] px-3 py-2 text-[12px] text-[#B42318]">
                          {livePanel.error}
                        </div>
                      )
                    : null}

                  {sectionKey === "taxonomies"
                    ? (
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Type</span>
                              <select
                                value={taxonomyDraft.type}
                                onChange={(event) => {
                                  setTaxonomyDraft(prev => ({
                                    ...prev,
                                    type: event.target.value as AdminTaxonomyRecord["type"],
                                  }));
                                  setSelectedTaxonomy(null);
                                }}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              >
                                <option value="incident_type">Incident Type</option>
                                <option value="support_need">Support Need</option>
                                <option value="language">Language</option>
                                <option value="culture">Culture</option>
                              </select>
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Key</span>
                              <input
                                value={taxonomyDraft.key}
                                onChange={event => setTaxonomyDraft(prev => ({ ...prev, key: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Label</span>
                              <input
                                value={taxonomyDraft.label}
                                onChange={event => setTaxonomyDraft(prev => ({ ...prev, label: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Description</span>
                              <input
                                value={taxonomyDraft.description}
                                onChange={event => setTaxonomyDraft(prev => ({ ...prev, description: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleTaxonomyCreate()}
                            disabled={isSubmittingLiveChange || !taxonomyDraft.key.trim() || !taxonomyDraft.label.trim()}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F67AE] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmittingLiveChange ? "Saving..." : "Create taxonomy"}
                          </button>
                          <div className="grid gap-3">
                            {visibleTaxonomies.map(item => (
                              <div key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-[14px] font-semibold text-[#1E293B]">{item.label}</p>
                                    <p className="mt-1 text-[12px] text-[#607B90]">
                                      {item.type}
                                      {" • "}
                                      {item.key}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void handleTaxonomyView(item)}
                                      disabled={isSubmittingLiveChange}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {selectedTaxonomy?._id === item._id ? "Hide" : "View"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void toggleTaxonomyActive(item)}
                                      disabled={isSubmittingLiveChange}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {item.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleTaxonomyDelete(item)}
                                      disabled={isSubmittingLiveChange}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#F4C7C3] px-3 text-[12px] font-semibold text-[#B42318] transition hover:bg-[#FFF7F6] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                {selectedTaxonomy?._id === item._id
                                  ? (
                                      <div className="mt-3 grid gap-2 border-t border-[#E5ECF3] pt-3 text-[11px] text-[#52667A] md:grid-cols-2">
                                        <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                          <span className="font-semibold text-[#1E293B]">Description</span>
                                          <p>{selectedTaxonomy.description || "No description provided."}</p>
                                        </div>
                                        <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                          <span className="font-semibold text-[#1E293B]">Status</span>
                                          <p>{selectedTaxonomy.isActive ? "Active" : "Inactive"}</p>
                                        </div>
                                        <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                          <span className="font-semibold text-[#1E293B]">Created</span>
                                          <p>{selectedTaxonomy.createdAt ? new Date(selectedTaxonomy.createdAt).toLocaleString() : "Not available"}</p>
                                        </div>
                                        <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                          <span className="font-semibold text-[#1E293B]">Updated</span>
                                          <p>{selectedTaxonomy.updatedAt ? new Date(selectedTaxonomy.updatedAt).toLocaleString() : "Not available"}</p>
                                        </div>
                                        <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 md:col-span-2">
                                          <span className="font-semibold text-[#1E293B]">Metadata</span>
                                          {Object.keys(selectedTaxonomyMetadata).length
                                            ? (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                  {Object.entries(selectedTaxonomyMetadata).map(([key, value]) => (
                                                    <span
                                                      key={key}
                                                      className="inline-flex items-center rounded-full border border-[#D8E3EE] bg-white px-2.5 py-1 text-[11px] text-[#607B90]"
                                                    >
                                                      <span className="font-semibold text-[#1E293B]">
                                                        {formatMetadataLabel(key)}
                                                        :
                                                      </span>
                                                      <span className="ml-1">{formatMetadataText(value)}</span>
                                                    </span>
                                                  ))}
                                                </div>
                                              )
                                            : <p className="mt-1 text-[#607B90]">None</p>}
                                        </div>
                                      </div>
                                    )
                                  : null}
                              </div>
                            ))}
                            {!visibleTaxonomies.length && !livePanel.isLoading
                              ? (
                                  <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                    No taxonomy records match this type yet.
                                  </div>
                                )
                              : null}
                          </div>
                        </div>
                      )
                    : null}

                  {sectionKey === "deliveries"
                    ? (
                        <div className="mt-4 space-y-3">
                          {livePanel.deliveries.length
                            ? livePanel.deliveries.map(item => (
                                <article key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <p className="text-[13px] font-semibold text-[#1E293B]">{item.destinationName}</p>
                                      <p className="mt-1 text-[12px] text-[#607B90]">
                                        {item.destinationType}
                                        {" via "}
                                        {item.channel}
                                        {" • "}
                                        {item.jurisdiction}
                                      </p>
                                      <p className="mt-1 text-[11px] text-[#607B90]">
                                        Report
                                        {" "}
                                        {item.reportId}
                                        {" · Template "}
                                        {item.templateKey ?? "default"}
                                      </p>
                                    </div>
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                                        deliveryStatusClass(item.status),
                                      )}
                                    >
                                      {deliveryStatusLabel(item.status)}
                                    </span>
                                  </div>
                                  <div className="mt-3 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-4">
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Outcome</span>
                                      <p>{item.actuallySent ? "Sent externally" : "Not externally sent"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Readiness</span>
                                      <p>{deliveryReadinessLabel(item)}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">External ref</span>
                                      <p>{item.externalReference ?? "Not received"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Artifacts</span>
                                      <p>{item.hasDeliveryArtifacts ? "Available" : "None"}</p>
                                    </div>
                                  </div>
                                  <div className="mt-2 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-2">
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Delivery mode</span>
                                      <p>{item.deliveryMode?.replace(/_/g, " ") ?? "Unknown"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Consent flags</span>
                                      <p>{item.requiredConsentFlags.join(", ") || "None"}</p>
                                    </div>
                                  </div>
                                  {item.deliveryConfigurationIssues?.length
                                    ? (
                                        <p className="mt-2 rounded-lg border border-[#FAD7A8] bg-[#FFF8ED] px-3 py-2 text-[11px] leading-5 text-[#9A5B12]">
                                          {item.deliveryConfigurationIssues.join(" ")}
                                        </p>
                                      )
                                    : null}
                                  {item.deliveryMessage
                                    ? <p className="mt-2 text-[11px] leading-5 text-[#607B90]">{item.deliveryMessage}</p>
                                    : null}
                                </article>
                              ))
                            : (
                                <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                  No delivery attempts are available yet.
                                </div>
                              )}
                        </div>
                      )
                    : null}

                  {sectionKey === "auditLogs"
                    ? (
                        <div className="mt-4 space-y-3">
                          {livePanel.auditLogs.length
                            ? livePanel.auditLogs.map(item => (
                                <article key={item.id ?? `${item.action}-${item.createdAt}`} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <p className="text-[13px] font-semibold text-[#1E293B]">{item.action}</p>
                                      <p className="mt-1 text-[12px] text-[#607B90]">
                                        {item.resourceType}
                                        {item.resourceId ? ` • ${item.resourceId}` : ""}
                                      </p>
                                      <p className="mt-1 text-[11px] text-[#607B90]">
                                        Actor:
                                        {" "}
                                        {item.actorType}
                                        {item.actorId ? ` • ${item.actorId}` : ""}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-[#EEF6FF] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0F67AE]">
                                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "No timestamp"}
                                    </span>
                                  </div>
                                  <div className="mt-3 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-3">
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">IP hash</span>
                                      <p>{item.ipHashPresent ? "Stored" : "Not stored"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">User agent hash</span>
                                      <p>{item.userAgentHashPresent ? "Stored" : "Not stored"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Metadata keys</span>
                                      <p>{item.metadata ? Object.keys(item.metadata).join(", ") || "None" : "None"}</p>
                                    </div>
                                  </div>
                                </article>
                              ))
                            : (
                                <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                  No masked audit records are available yet.
                                </div>
                              )}
                        </div>
                      )
                    : null}

                  {sectionKey === "destinations"
                    ? (
                        <div className="mt-4 space-y-4">
                          <div className="flex flex-col gap-2 rounded-xl border border-[#D8E3EE] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h5 className="text-[15px] font-semibold text-[#1E293B]">
                                {editingDestinationId ? "Edit Destination" : "Create Destination"}
                              </h5>
                              <p className="mt-1 text-[12px] text-[#607B90]">
                                All routing, consent, contact, language, and template metadata fields are persisted through the backend.
                              </p>
                            </div>
                            {editingDestinationId
                              ? (
                                  <button
                                    type="button"
                                    onClick={cancelDestinationEdit}
                                    className="inline-flex h-9 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-3 text-[12px] font-semibold text-[#52667A] transition hover:bg-[#F8FBFF]"
                                  >
                                    Cancel edit
                                  </button>
                                )
                              : null}
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Type</span>
                              <select
                                value={destinationDraft.type}
                                onChange={event => setDestinationDraft(prev => ({
                                  ...prev,
                                  type: event.target.value as AdminDestinationRecord["type"],
                                }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              >
                                <option value="police">Police</option>
                                <option value="anti_discrimination_agency">Anti-Discrimination Agency</option>
                                <option value="esafety">eSafety</option>
                                <option value="legal_aid">Legal Aid</option>
                                <option value="community_legal_centre">Community Legal Centre</option>
                                <option value="education_provider">Education Provider</option>
                                <option value="workplace_channel">Workplace Channel</option>
                                <option value="scamwatch">Scamwatch</option>
                                <option value="reportcyber">ReportCyber</option>
                                <option value="community_support_org">Community Support Org</option>
                              </select>
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Key</span>
                              <input
                                value={destinationDraft.key}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, key: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Name</span>
                              <input
                                value={destinationDraft.name}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, name: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Channel</span>
                              <select
                                value={destinationDraft.channel}
                                onChange={event => setDestinationDraft(prev => ({
                                  ...prev,
                                  channel: event.target.value as AdminDestinationRecord["channel"],
                                }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              >
                                <option value="api_oauth">API OAuth</option>
                                <option value="api_mtls">API mTLS</option>
                                <option value="secure_email_pgp">Secure Email PGP</option>
                                <option value="secure_email">Secure Email</option>
                                <option value="manual_export_pdf">Manual Export PDF</option>
                                <option value="manual_export_json">Manual Export JSON</option>
                                <option value="booking_link">Booking Link</option>
                              </select>
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Jurisdiction</span>
                              <input
                                value={destinationDraft.jurisdiction}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, jurisdiction: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Languages</span>
                              <input
                                value={destinationDraft.languages}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, languages: event.target.value }))}
                                placeholder="en, ar, zh"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Endpoint</span>
                              <input
                                value={destinationDraft.endpoint}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, endpoint: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Contact Email</span>
                              <input
                                value={destinationDraft.contactEmail}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, contactEmail: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A]">
                              <span>Contact Phone</span>
                              <input
                                value={destinationDraft.contactPhone}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, contactPhone: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                              <span>Minimum Required Info</span>
                              <input
                                value={destinationDraft.minimumRequiredInfo}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, minimumRequiredInfo: event.target.value }))}
                                placeholder="who, what, when, where"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                              <span>Anonymity Options</span>
                              <input
                                value={destinationDraft.anonymityOptions}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, anonymityOptions: event.target.value }))}
                                placeholder="anonymous, pseudonymous, identified"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2 xl:col-span-4">
                              <span>Expected Next Steps</span>
                              <input
                                value={destinationDraft.expectedNextSteps}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, expectedNextSteps: event.target.value }))}
                                placeholder="review intake, acknowledge receipt, contact reporter"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                              <span>Required Consent Flags</span>
                              <input
                                value={destinationDraft.requiredConsentFlags}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, requiredConsentFlags: event.target.value }))}
                                placeholder="share_with_agencies"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                              <span>Incident Types</span>
                              <input
                                value={destinationDraft.incidentTypes}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, incidentTypes: event.target.value }))}
                                placeholder="online_harassment, cyber_scam"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                              <span>Recommendation Reason</span>
                              <input
                                value={destinationDraft.recommendationReason}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, recommendationReason: event.target.value }))}
                                placeholder="Suggested for NSW racial abuse reports"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <div className="space-y-2 md:col-span-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] text-[#52667A]">Submission Title</span>
                                <select
                                  value=""
                                  onChange={(event) => {
                                    if (!event.target.value) {
                                      return;
                                    }

                                    setDestinationDraft(prev => ({
                                      ...prev,
                                      submissionTitleTemplate: event.target.value,
                                    }));
                                  }}
                                  className="h-8 rounded-md border border-[#D8E3EE] bg-white px-2 text-[12px] text-[#52667A]"
                                >
                                  <option value="">Use preset</option>
                                  {titleTemplatePresets.map(preset => (
                                    <option key={preset.label} value={preset.template}>{preset.label}</option>
                                  ))}
                                </select>
                              </div>
                              <input
                                value={storageTemplateToFriendly(destinationDraft.submissionTitleTemplate)}
                                onChange={event =>
                                  setDestinationDraft(prev => ({
                                    ...prev,
                                    submissionTitleTemplate: friendlyTemplateToStorage(event.target.value),
                                  }))}
                                placeholder="SafeSpeak report [Reference No]"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-[#607B90]">Insert:</span>
                                {templateVariableOptions.slice(0, 5).map(variable => (
                                  <button
                                    key={variable.value}
                                    type="button"
                                    onClick={() =>
                                      setDestinationDraft(prev => ({
                                        ...prev,
                                        submissionTitleTemplate: appendTemplateVariable(
                                          prev.submissionTitleTemplate,
                                          variable.value,
                                        ),
                                      }))}
                                    className="rounded-full border border-[#D8E3EE] bg-white px-2 py-1 text-[11px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                  >
                                    {variable.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] text-[#52667A]">Submission Summary</span>
                                <select
                                  value=""
                                  onChange={(event) => {
                                    if (!event.target.value) {
                                      return;
                                    }

                                    setDestinationDraft(prev => ({
                                      ...prev,
                                      submissionSummaryTemplate: event.target.value,
                                    }));
                                  }}
                                  className="h-8 rounded-md border border-[#D8E3EE] bg-white px-2 text-[12px] text-[#52667A]"
                                >
                                  <option value="">Use preset</option>
                                  {summaryTemplatePresets.map(preset => (
                                    <option key={preset.label} value={preset.template}>{preset.label}</option>
                                  ))}
                                </select>
                              </div>
                              <input
                                value={storageTemplateToFriendly(destinationDraft.submissionSummaryTemplate)}
                                onChange={event =>
                                  setDestinationDraft(prev => ({
                                    ...prev,
                                    submissionSummaryTemplate: friendlyTemplateToStorage(event.target.value),
                                  }))}
                                placeholder="[Summary]"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-[#607B90]">Insert:</span>
                                {templateVariableOptions.slice(1, 7).map(variable => (
                                  <button
                                    key={variable.value}
                                    type="button"
                                    onClick={() =>
                                      setDestinationDraft(prev => ({
                                        ...prev,
                                        submissionSummaryTemplate: appendTemplateVariable(
                                          prev.submissionSummaryTemplate,
                                          variable.value,
                                        ),
                                      }))}
                                    className="rounded-full border border-[#D8E3EE] bg-white px-2 py-1 text-[11px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                  >
                                    {variable.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <label className="inline-flex items-center gap-2 text-[12px] text-[#52667A]">
                              <input
                                type="checkbox"
                                checked={destinationDraft.consentRequired}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, consentRequired: event.target.checked }))}
                              />
                              Consent required
                            </label>
                            <label className="inline-flex items-center gap-2 text-[12px] text-[#52667A]">
                              <input
                                type="checkbox"
                                checked={destinationDraft.supportsAcknowledgement}
                                onChange={event => setDestinationDraft(prev => ({
                                  ...prev,
                                  supportsAcknowledgement: event.target.checked,
                                }))}
                              />
                              Supports acknowledgement
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDestinationCreate()}
                            disabled={
                              isSubmittingLiveChange
                              || !destinationDraft.key.trim()
                              || !destinationDraft.name.trim()
                              || !destinationDraft.jurisdiction.trim()
                            }
                            className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F67AE] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmittingLiveChange
                              ? "Saving..."
                              : editingDestinationId
                                ? "Save destination"
                                : "Create destination"}
                          </button>
                          <div className="mt-6 border-t border-[#E5ECF3] pt-4">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                              <div>
                                <h5 className="text-[15px] font-semibold text-[#1E293B]">Destination Records</h5>
                                <p className="mt-1 text-[12px] text-[#607B90]">
                                  {visibleDestinations.length}
                                  {" of "}
                                  {livePanel.destinations.length}
                                  {" records shown from the backend."}
                                </p>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-3 xl:w-[620px]">
                                <input
                                  value={destinationSearchQuery}
                                  onChange={event => setDestinationSearchQuery(event.target.value)}
                                  placeholder="Search destinations"
                                  className="h-10 rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                                <select
                                  value={destinationTypeFilter}
                                  onChange={event =>
                                    setDestinationTypeFilter(event.target.value as AdminDestinationRecord["type"] | "all")}
                                  className="h-10 rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                >
                                  <option value="all">All types</option>
                                  <option value="police">Police</option>
                                  <option value="anti_discrimination_agency">Anti-Discrimination Agency</option>
                                  <option value="esafety">eSafety</option>
                                  <option value="legal_aid">Legal Aid</option>
                                  <option value="community_legal_centre">Community Legal Centre</option>
                                  <option value="education_provider">Education Provider</option>
                                  <option value="workplace_channel">Workplace Channel</option>
                                  <option value="scamwatch">Scamwatch</option>
                                  <option value="reportcyber">ReportCyber</option>
                                  <option value="community_support_org">Community Support Org</option>
                                </select>
                                <select
                                  value={destinationChannelFilter}
                                  onChange={event =>
                                    setDestinationChannelFilter(event.target.value as AdminDestinationRecord["channel"] | "all")}
                                  className="h-10 rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                >
                                  <option value="all">All channels</option>
                                  <option value="api_oauth">API OAuth</option>
                                  <option value="api_mtls">API mTLS</option>
                                  <option value="secure_email_pgp">Secure Email PGP</option>
                                  <option value="secure_email">Secure Email</option>
                                  <option value="manual_export_pdf">Manual Export PDF</option>
                                  <option value="manual_export_json">Manual Export JSON</option>
                                  <option value="booking_link">Booking Link</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3">
                            {visibleDestinations.map(item => (
                              <div key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-[14px] font-semibold text-[#1E293B]">{item.name}</p>
                                      <span className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                                        item.isActive ? "bg-[#E8F7EE] text-[#0F7A43]" : "bg-[#F1F5F9] text-[#64748B]",
                                      )}
                                      >
                                        {item.isActive ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[12px] text-[#607B90]">
                                      {item.key}
                                      {" • "}
                                      {item.type}
                                      {` • ${item.channel}`}
                                      {` • ${item.jurisdiction}`}
                                      {item.endpoint ? ` • ${item.endpoint}` : ""}
                                    </p>
                                    <p className="mt-1 text-[12px] text-[#607B90]">
                                      {item.languages.join(", ")}
                                      {item.minimumRequiredInfo.length
                                        ? ` • Required: ${item.minimumRequiredInfo.join(", ")}`
                                        : ""}
                                    </p>
                                    {item.metadata?.incidentTypes?.length || item.metadata?.requiredConsentFlags?.length
                                      ? (
                                          <p className="mt-1 text-[12px] text-[#607B90]">
                                            {item.metadata?.incidentTypes?.length
                                              ? `Incident types: ${item.metadata.incidentTypes.join(", ")}`
                                              : ""}
                                            {item.metadata?.requiredConsentFlags?.length
                                              ? `${item.metadata?.incidentTypes?.length
                                                ? " • "
                                                : ""}Consent: ${item.metadata.requiredConsentFlags.join(", ")}`
                                              : ""}
                                          </p>
                                        )
                                      : null}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startDestinationEdit(item)}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void toggleDestinationActive(item)}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                    >
                                      {item.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-3 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-3">
                                  <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                    <span className="font-semibold text-[#1E293B]">Contacts</span>
                                    <p>{[item.contactEmail, item.contactPhone].filter(Boolean).join(" • ") || "Not configured"}</p>
                                  </div>
                                  <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                    <span className="font-semibold text-[#1E293B]">Anonymity</span>
                                    <p>{item.anonymityOptions.join(", ") || "Not configured"}</p>
                                  </div>
                                  <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                    <span className="font-semibold text-[#1E293B]">Consent and acknowledgement</span>
                                    <p>
                                      {item.consentRequired ? "Consent required" : "Consent not required"}
                                      {" • "}
                                      {item.supportsAcknowledgement ? "Acknowledgement supported" : "No acknowledgement"}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 md:col-span-3">
                                    <span className="font-semibold text-[#1E293B]">Expected next steps</span>
                                    <p>{item.expectedNextSteps.join(", ") || "Not configured"}</p>
                                  </div>
                                  <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 md:col-span-3">
                                    <span className="font-semibold text-[#1E293B]">Metadata</span>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                      {Object.entries(item.metadata ?? {}).length
                                        ? Object.entries(item.metadata ?? {}).map(([key, value]) => (
                                            <span
                                              key={key}
                                              className="inline-flex rounded-full border border-[#D8E3EE] bg-white px-2 py-1"
                                            >
                                              <span className="font-semibold text-[#1E293B]">
                                                {formatMetadataLabel(key)}
                                                :
                                              </span>
                                              <span className="ml-1">{formatMetadataText(value)}</span>
                                            </span>
                                          ))
                                        : <span>Not configured</span>}
                                    </div>
                                  </div>
                                  <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 md:col-span-3">
                                    <span className="font-semibold text-[#1E293B]">Audit timestamps</span>
                                    <p>
                                      Created:
                                      {" "}
                                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Not available"}
                                      {" • Updated: "}
                                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "Not available"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {!visibleDestinations.length && !livePanel.isLoading
                              ? (
                                  <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                    No destination records match the current filters.
                                  </div>
                                )
                              : null}
                          </div>
                          <div className="mt-6 border-t border-[#E5ECF3] pt-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex flex-col gap-1">
                                <h5 className="text-[15px] font-semibold text-[#1E293B]">
                                  {editingSubmissionTemplateId ? "Edit Submission Template" : "Submission Templates"}
                                </h5>
                                <p className="text-[12px] text-[#607B90]">
                                  Define explicit payload mappings and acknowledgement modes for each delivery channel.
                                </p>
                              </div>
                              {editingSubmissionTemplateId
                                ? (
                                    <button
                                      type="button"
                                      onClick={cancelSubmissionTemplateEdit}
                                      className="inline-flex h-9 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-3 text-[12px] font-semibold text-[#52667A] transition hover:bg-[#F8FBFF]"
                                    >
                                      Cancel edit
                                    </button>
                                  )
                                : null}
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <label className="space-y-1 text-[12px] text-[#52667A]">
                                <span>Key</span>
                                <input
                                  value={submissionTemplateDraft.key}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({ ...prev, key: event.target.value }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A]">
                                <span>Name</span>
                                <input
                                  value={submissionTemplateDraft.name}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({ ...prev, name: event.target.value }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A]">
                                <span>Destination Type</span>
                                <select
                                  value={submissionTemplateDraft.destinationType}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({
                                    ...prev,
                                    destinationType: event.target.value as AdminDestinationRecord["type"],
                                  }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                >
                                  <option value="police">Police</option>
                                  <option value="anti_discrimination_agency">Anti-Discrimination Agency</option>
                                  <option value="esafety">eSafety</option>
                                  <option value="legal_aid">Legal Aid</option>
                                  <option value="community_legal_centre">Community Legal Centre</option>
                                  <option value="education_provider">Education Provider</option>
                                  <option value="workplace_channel">Workplace Channel</option>
                                  <option value="scamwatch">Scamwatch</option>
                                  <option value="reportcyber">ReportCyber</option>
                                  <option value="community_support_org">Community Support Org</option>
                                </select>
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A]">
                                <span>Channel</span>
                                <select
                                  value={submissionTemplateDraft.channel}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({
                                    ...prev,
                                    channel: event.target.value as AdminDestinationRecord["channel"],
                                  }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                >
                                  <option value="api_oauth">API OAuth</option>
                                  <option value="api_mtls">API mTLS</option>
                                  <option value="secure_email_pgp">Secure Email PGP</option>
                                  <option value="secure_email">Secure Email</option>
                                  <option value="manual_export_pdf">Manual Export PDF</option>
                                  <option value="manual_export_json">Manual Export JSON</option>
                                  <option value="booking_link">Booking Link</option>
                                </select>
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A]">
                                <span>Jurisdiction</span>
                                <input
                                  value={submissionTemplateDraft.jurisdiction}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({ ...prev, jurisdiction: event.target.value }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                              </label>
                              <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] text-[#52667A]">Title Template</span>
                                  <select
                                    value=""
                                    onChange={(event) => {
                                      if (!event.target.value) {
                                        return;
                                      }

                                      setSubmissionTemplateDraft(prev => ({
                                        ...prev,
                                        titleTemplate: event.target.value,
                                      }));
                                    }}
                                    className="h-8 rounded-md border border-[#D8E3EE] bg-white px-2 text-[12px] text-[#52667A]"
                                  >
                                    <option value="">Use preset</option>
                                    {titleTemplatePresets.map(preset => (
                                      <option key={preset.label} value={preset.template}>{preset.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <input
                                  value={storageTemplateToFriendly(submissionTemplateDraft.titleTemplate)}
                                  onChange={event =>
                                    setSubmissionTemplateDraft(prev => ({
                                      ...prev,
                                      titleTemplate: friendlyTemplateToStorage(event.target.value),
                                    }))}
                                  placeholder="SafeSpeak report [Reference No]"
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] text-[#607B90]">Insert:</span>
                                  {templateVariableOptions.slice(0, 5).map(variable => (
                                    <button
                                      key={variable.value}
                                      type="button"
                                      onClick={() =>
                                        setSubmissionTemplateDraft(prev => ({
                                          ...prev,
                                          titleTemplate: appendTemplateVariable(prev.titleTemplate, variable.value),
                                        }))}
                                      className="rounded-full border border-[#D8E3EE] bg-white px-2 py-1 text-[11px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                    >
                                      {variable.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] text-[#52667A]">Summary Template</span>
                                  <select
                                    value=""
                                    onChange={(event) => {
                                      if (!event.target.value) {
                                        return;
                                      }

                                      setSubmissionTemplateDraft(prev => ({
                                        ...prev,
                                        summaryTemplate: event.target.value,
                                      }));
                                    }}
                                    className="h-8 rounded-md border border-[#D8E3EE] bg-white px-2 text-[12px] text-[#52667A]"
                                  >
                                    <option value="">Use preset</option>
                                    {summaryTemplatePresets.map(preset => (
                                      <option key={preset.label} value={preset.template}>{preset.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <input
                                  value={storageTemplateToFriendly(submissionTemplateDraft.summaryTemplate)}
                                  onChange={event =>
                                    setSubmissionTemplateDraft(prev => ({
                                      ...prev,
                                      summaryTemplate: friendlyTemplateToStorage(event.target.value),
                                    }))}
                                  placeholder="[Summary]"
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] text-[#607B90]">Insert:</span>
                                  {templateVariableOptions.slice(1, 7).map(variable => (
                                    <button
                                      key={variable.value}
                                      type="button"
                                      onClick={() =>
                                        setSubmissionTemplateDraft(prev => ({
                                          ...prev,
                                          summaryTemplate: appendTemplateVariable(prev.summaryTemplate, variable.value),
                                        }))}
                                      className="rounded-full border border-[#D8E3EE] bg-white px-2 py-1 text-[11px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                    >
                                      {variable.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-3 md:col-span-2 xl:col-span-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-[12px] font-semibold text-[#52667A]">Field Mappings</p>
                                    <p className="mt-1 text-[11px] text-[#607B90]">
                                      Connect SafeSpeak fields to the destination fields that receive them.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={addSubmissionTemplateFieldMapping}
                                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                  >
                                    Add mapping
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {submissionTemplateDraft.fieldMappings.length
                                    ? submissionTemplateDraft.fieldMappings.map(mapping => (
                                        <div
                                          key={mapping.id}
                                          className="grid gap-2 rounded-xl border border-[#E5ECF3] bg-white p-3 md:grid-cols-[1fr_1fr_120px_1fr_auto]"
                                        >
                                          <label className="space-y-1 text-[12px] text-[#52667A]">
                                            <span>SafeSpeak Field</span>
                                            <select
                                              value={mapping.source}
                                              onChange={event =>
                                                updateSubmissionTemplateFieldMapping(mapping.id, { source: event.target.value })}
                                              className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                            >
                                              <option value="">Choose field</option>
                                              {mapping.source
                                                && !safeSpeakFieldOptions.some(option => option.value === mapping.source)
                                                ? <option value={mapping.source}>{mapping.source}</option>
                                                : null}
                                              {safeSpeakFieldOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                              ))}
                                            </select>
                                          </label>
                                          <label className="space-y-1 text-[12px] text-[#52667A]">
                                            <span>Destination Field</span>
                                            <input
                                              value={mapping.target}
                                              onChange={event =>
                                                updateSubmissionTemplateFieldMapping(mapping.id, { target: event.target.value })}
                                              placeholder="referenceId"
                                              className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                            />
                                          </label>
                                          <label className="flex items-center gap-2 self-end rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 text-[12px] text-[#52667A]">
                                            <input
                                              type="checkbox"
                                              checked={mapping.required}
                                              onChange={event =>
                                                updateSubmissionTemplateFieldMapping(mapping.id, { required: event.target.checked })}
                                            />
                                            Required
                                          </label>
                                          <label className="space-y-1 text-[12px] text-[#52667A]">
                                            <span>Transform</span>
                                            <select
                                              value={mapping.transform}
                                              onChange={event =>
                                                updateSubmissionTemplateFieldMapping(mapping.id, { transform: event.target.value })}
                                              className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                            >
                                              {mapping.transform
                                                && !transformOptions.some(option => option.value === mapping.transform)
                                                ? <option value={mapping.transform}>{mapping.transform}</option>
                                                : null}
                                              {transformOptions.map(option => (
                                                <option key={option.value || "none"} value={option.value}>{option.label}</option>
                                              ))}
                                            </select>
                                          </label>
                                          <button
                                            type="button"
                                            onClick={() => removeSubmissionTemplateFieldMapping(mapping.id)}
                                            className="self-end rounded-md border border-[#F4C7C3] px-3 py-2 text-[12px] font-semibold text-[#B42318] transition hover:bg-[#FFF7F6]"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      ))
                                    : (
                                        <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                          No field mappings configured.
                                        </div>
                                      )}
                                </div>
                              </div>
                              <div className="space-y-3 md:col-span-2 xl:col-span-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-[12px] font-semibold text-[#52667A]">Static Payload Fields</p>
                                    <p className="mt-1 text-[11px] text-[#607B90]">
                                      Add fixed fields that should be sent with every payload for this template.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={addStaticPayloadEntry}
                                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                  >
                                    Add payload field
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {submissionTemplateDraft.staticPayloadEntries.length
                                    ? submissionTemplateDraft.staticPayloadEntries.map((entry) => {
                                        const nextBooleanValue = ["true", "false"].includes(entry.value)
                                          ? entry.value
                                          : "true";

                                        return (
                                          <div
                                            key={entry.id}
                                            className="grid gap-2 rounded-xl border border-[#E5ECF3] bg-white p-3 md:grid-cols-[1fr_1fr_140px_auto]"
                                          >
                                            <label className="space-y-1 text-[12px] text-[#52667A]">
                                              <span>Field Name</span>
                                              <input
                                                value={entry.key}
                                                onChange={event => updateStaticPayloadEntry(entry.id, { key: event.target.value })}
                                                placeholder="source"
                                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                              />
                                            </label>
                                            <label className="space-y-1 text-[12px] text-[#52667A]">
                                              <span>Value</span>
                                              {entry.valueType === "boolean"
                                                ? (
                                                    <select
                                                      value={nextBooleanValue}
                                                      onChange={event => updateStaticPayloadEntry(entry.id, { value: event.target.value })}
                                                      className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                                    >
                                                      <option value="true">True</option>
                                                      <option value="false">False</option>
                                                    </select>
                                                  )
                                                : (
                                                    <input
                                                      value={entry.value}
                                                      onChange={event => updateStaticPayloadEntry(entry.id, { value: event.target.value })}
                                                      placeholder="safespeak"
                                                      className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                                    />
                                                  )}
                                            </label>
                                            <label className="space-y-1 text-[12px] text-[#52667A]">
                                              <span>Type</span>
                                              <select
                                                value={entry.valueType}
                                                onChange={(event) => {
                                                  const valueType = event.target.value as StaticPayloadEntryDraft["valueType"];

                                                  updateStaticPayloadEntry(entry.id, {
                                                    value: valueType === "boolean" ? nextBooleanValue : entry.value,
                                                    valueType,
                                                  });
                                                }}
                                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                              >
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                              </select>
                                            </label>
                                            <button
                                              type="button"
                                              onClick={() => removeStaticPayloadEntry(entry.id)}
                                              className="self-end rounded-md border border-[#F4C7C3] px-3 py-2 text-[12px] font-semibold text-[#B42318] transition hover:bg-[#FFF7F6]"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        );
                                      })
                                    : (
                                        <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                          No static payload fields configured.
                                        </div>
                                      )}
                                  {Object.keys(submissionTemplateDraft.preservedStaticPayload).length
                                    ? (
                                        <div className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 text-[11px] text-[#607B90]">
                                          <span className="font-semibold text-[#1E293B]">Preserved system-managed fields:</span>
                                          <div className="mt-1 flex flex-wrap gap-1.5">
                                            {Object.entries(submissionTemplateDraft.preservedStaticPayload).map(([key, value]) => (
                                              <span
                                                key={key}
                                                className="inline-flex rounded-full border border-[#D8E3EE] bg-white px-2 py-1"
                                              >
                                                <span className="font-semibold text-[#1E293B]">
                                                  {formatMetadataLabel(key)}
                                                  :
                                                </span>
                                                <span className="ml-1">{formatMetadataText(value)}</span>
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    : null}
                                </div>
                              </div>
                              <label className="space-y-1 text-[12px] text-[#52667A]">
                                <span>Acknowledgement Mode</span>
                                <select
                                  value={submissionTemplateDraft.acknowledgementMode}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({
                                    ...prev,
                                    acknowledgementMode: event.target.value as "manual" | "sync_reference" | "async_webhook",
                                  }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                >
                                  <option value="manual">Manual</option>
                                  <option value="sync_reference">Sync Reference</option>
                                  <option value="async_webhook">Async Webhook</option>
                                </select>
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A]">
                                <span>Attachment Mode</span>
                                <select
                                  value={submissionTemplateDraft.attachmentMode}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({
                                    ...prev,
                                    attachmentMode: event.target.value as "metadata_only" | "include_hashes" | "include_manifest",
                                  }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                >
                                  <option value="metadata_only">Metadata Only</option>
                                  <option value="include_hashes">Include Hashes</option>
                                  <option value="include_manifest">Include Manifest</option>
                                </select>
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleSubmissionTemplateCreate()}
                              disabled={
                                isSubmittingLiveChange
                                || !submissionTemplateDraft.key.trim()
                                || !submissionTemplateDraft.name.trim()
                              }
                              className="mt-3 inline-flex h-10 items-center justify-center rounded-md bg-[#0F67AE] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isSubmittingLiveChange
                                ? "Saving..."
                                : editingSubmissionTemplateId
                                  ? "Save template"
                                  : "Create template"}
                            </button>
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <h5 className="text-[15px] font-semibold text-[#1E293B]">Template Records</h5>
                                <p className="mt-1 text-[12px] text-[#607B90]">
                                  {visibleSubmissionTemplates.length}
                                  {" of "}
                                  {livePanel.submissionTemplates.length}
                                  {" records shown from the backend."}
                                </p>
                              </div>
                              <input
                                value={templateSearchQuery}
                                onChange={event => setTemplateSearchQuery(event.target.value)}
                                placeholder="Search templates"
                                className="h-10 rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B] sm:w-[320px]"
                              />
                            </div>
                            <div className="mt-3 grid gap-3">
                              {visibleSubmissionTemplates.map(item => (
                                <div key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-[14px] font-semibold text-[#1E293B]">{item.name}</p>
                                        <span className={cn(
                                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                                          item.isActive ? "bg-[#E8F7EE] text-[#0F7A43]" : "bg-[#F1F5F9] text-[#64748B]",
                                        )}
                                        >
                                          {item.isActive ? "Active" : "Inactive"}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-[12px] text-[#607B90]">
                                        {item.key}
                                        {" • "}
                                        {item.destinationType}
                                        {` • ${item.channel}`}
                                        {` • ${item.jurisdiction}`}
                                      </p>
                                      <p className="mt-1 text-[12px] text-[#607B90]">
                                        Ack:
                                        {" "}
                                        {item.acknowledgementMode}
                                        {" • Attachments: "}
                                        {item.attachmentMode}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startSubmissionTemplateEdit(item)}
                                        className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => void toggleSubmissionTemplateActive(item)}
                                        className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                      >
                                        {item.isActive ? "Deactivate" : "Activate"}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-3 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-2">
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Title template</span>
                                      <p>{storageTemplateToFriendly(item.titleTemplate)}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Summary template</span>
                                      <p>{storageTemplateToFriendly(item.summaryTemplate)}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 md:col-span-2">
                                      <span className="font-semibold text-[#1E293B]">Field mappings</span>
                                      <div className="mt-1 flex flex-wrap gap-1.5">
                                        {item.fieldMappings.length
                                          ? item.fieldMappings.map(mapping => (
                                              <span
                                                key={`${mapping.source}:${mapping.target}:${mapping.transform ?? ""}`}
                                                className="inline-flex rounded-full border border-[#D8E3EE] bg-white px-2 py-1"
                                              >
                                                {getSafeSpeakFieldLabel(mapping.source)}
                                                {" -> "}
                                                {mapping.target}
                                                {mapping.required ? " (required)" : ""}
                                                {mapping.transform ? ` (${mapping.transform})` : ""}
                                              </span>
                                            ))
                                          : <span>None</span>}
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2 md:col-span-2">
                                      <span className="font-semibold text-[#1E293B]">Static payload fields</span>
                                      <div className="mt-1 flex flex-wrap gap-1.5">
                                        {Object.entries(item.staticPayload ?? {}).length
                                          ? Object.entries(item.staticPayload ?? {}).map(([key, value]) => (
                                              <span
                                                key={key}
                                                className="inline-flex rounded-full border border-[#D8E3EE] bg-white px-2 py-1"
                                              >
                                                <span className="font-semibold text-[#1E293B]">
                                                  {formatMetadataLabel(key)}
                                                  :
                                                </span>
                                                <span className="ml-1">{formatMetadataText(value)}</span>
                                              </span>
                                            ))
                                          : <span>None</span>}
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Metadata</span>
                                      <p>{formatMetadataText(item.metadata ?? {})}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Audit timestamps</span>
                                      <p>
                                        Created:
                                        {" "}
                                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Not available"}
                                        {" • Updated: "}
                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "Not available"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {!visibleSubmissionTemplates.length && !livePanel.isLoading
                                ? (
                                    <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                      No submission templates match the current search.
                                    </div>
                                  )
                                : null}
                            </div>
                          </div>
                          <div className="mt-6 border-t border-[#E5ECF3] pt-4">
                            <div className="flex flex-col gap-1">
                              <h5 className="text-[15px] font-semibold text-[#1E293B]">Recent Delivery Activity</h5>
                              <p className="text-[12px] text-[#607B90]">
                                Delivery attempts are displayed here without raw payload, evidence, or consent snapshots.
                              </p>
                            </div>
                            <div className="mt-3 grid gap-3">
                              {livePanel.deliveries.slice(0, 6).map(item => (
                                <article key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <p className="text-[13px] font-semibold text-[#1E293B]">{item.destinationName}</p>
                                      <p className="mt-1 text-[12px] text-[#607B90]">
                                        {item.destinationKey}
                                        {" • "}
                                        {item.destinationType}
                                        {" via "}
                                        {item.channel}
                                        {" • "}
                                        {item.jurisdiction}
                                      </p>
                                      <p className="mt-1 text-[11px] text-[#607B90]">
                                        Report
                                        {" "}
                                        {item.reportId}
                                        {" · Template "}
                                        {item.templateKey ?? "default"}
                                      </p>
                                    </div>
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                                        deliveryStatusClass(item.status),
                                      )}
                                    >
                                      {deliveryStatusLabel(item.status)}
                                    </span>
                                  </div>
                                  <div className="mt-3 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-4">
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Outcome</span>
                                      <p>{item.actuallySent ? "Sent externally" : "Not externally sent"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Readiness</span>
                                      <p>{deliveryReadinessLabel(item)}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">External ref</span>
                                      <p>{item.externalReference ?? "Not received"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Artifacts</span>
                                      <p>{item.hasDeliveryArtifacts ? "Available" : "None"}</p>
                                    </div>
                                  </div>
                                  <div className="mt-2 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-2">
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Delivery mode</span>
                                      <p>{item.deliveryMode?.replace(/_/g, " ") ?? "Unknown"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Consent flags</span>
                                      <p>{item.requiredConsentFlags.join(", ") || "None"}</p>
                                    </div>
                                  </div>
                                  {item.deliveryConfigurationIssues?.length
                                    ? (
                                        <p className="mt-2 rounded-lg border border-[#FAD7A8] bg-[#FFF8ED] px-3 py-2 text-[11px] leading-5 text-[#9A5B12]">
                                          {item.deliveryConfigurationIssues.join(" ")}
                                        </p>
                                      )
                                    : null}
                                  {item.deliveryMessage
                                    ? <p className="mt-2 text-[11px] leading-5 text-[#607B90]">{item.deliveryMessage}</p>
                                    : null}
                                </article>
                              ))}
                              {!livePanel.deliveries.length && !livePanel.isLoading
                                ? (
                                    <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                      No delivery activity is available yet.
                                    </div>
                                  )
                                : null}
                            </div>
                          </div>
                        </div>
                      )
                    : null}

                  {sectionKey === "privacyRequests"
                    ? (
                        <div className="mt-4 grid gap-3">
                          {livePanel.privacyRequests.slice(0, 8).map(item => (
                            <div key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <p className="text-[14px] font-semibold text-[#1E293B]">
                                    {item.requestType.replace(/_/g, " ")}
                                  </p>
                                  <p className="mt-1 text-[12px] text-[#607B90]">
                                    {item.requesterEmail ?? "Requester email unavailable"}
                                    {" • "}
                                    {item.status}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(["in_review", "completed", "rejected"] as const).map(status => (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => void updatePrivacyStatus(item, status)}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                    >
                                      {status.replace(/_/g, " ")}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    : null}

                  {sectionKey === "platformHealth"
                    ? (
                        <div className="mt-4 space-y-4">
                          {livePanel.platformHealth
                            ? (
                                <>
                                  <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                                    <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#607B90]">System Readiness</p>
                                          <p className="mt-2 text-[22px] font-semibold text-[#1E293B]">
                                            {platformHealthStatusLabel(livePanel.platformHealth.overallStatus)}
                                          </p>
                                          <p className="mt-2 text-[12px] leading-5 text-[#607B90]">
                                            {livePanel.platformHealth.service.name}
                                            {" "}
                                            {livePanel.platformHealth.service.version}
                                            {" • "}
                                            {livePanel.platformHealth.service.environment}
                                            {" • "}
                                            {livePanel.platformHealth.service.uptimeLabel}
                                            {" uptime"}
                                          </p>
                                        </div>
                                        <span
                                          className={cn(
                                            "inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                                            platformHealthStatusClass(livePanel.platformHealth.overallStatus),
                                          )}
                                        >
                                          {livePanel.platformHealth.overallStatus.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                      <p className="mt-3 text-[11px] text-[#607B90]">
                                        Generated
                                        {" "}
                                        {new Date(livePanel.platformHealth.generatedAt).toLocaleString()}
                                        {" "}
                                        from
                                        {" "}
                                        {livePanel.platformHealth.service.apiPrefix}
                                        .
                                      </p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {livePanel.platformHealth.stats.map(item => (
                                        <div key={item.label} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#607B90]">{item.label}</p>
                                          <p className="mt-2 text-[17px] font-semibold text-[#1E293B]">{item.value}</p>
                                          <p className="mt-1 text-[11px] leading-5 text-[#607B90]">{item.helper}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid gap-3 xl:grid-cols-2">
                                    {livePanel.platformHealth.checks.map(check => (
                                      <article key={check.id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <p className="text-[14px] font-semibold text-[#1E293B]">{check.label}</p>
                                            <p className="mt-1 text-[12px] text-[#607B90]">
                                              {check.category}
                                              {" • "}
                                              {check.owner}
                                            </p>
                                          </div>
                                          <span
                                            className={cn(
                                              "inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                                              platformHealthStatusClass(check.status),
                                            )}
                                          >
                                            {platformHealthStatusLabel(check.status)}
                                          </span>
                                        </div>
                                        <p className="mt-2 text-[12px] leading-5 text-[#475569]">{check.summary}</p>
                                        <div className="mt-3 rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#607B90]">Metric</p>
                                          <p className="mt-1 text-[13px] font-semibold text-[#1E293B]">{check.metric}</p>
                                        </div>
                                        <ul className="mt-3 space-y-1.5 text-[11px] leading-5 text-[#607B90]">
                                          {check.details.map(detail => (
                                            <li key={detail}>{detail}</li>
                                          ))}
                                        </ul>
                                      </article>
                                    ))}
                                  </div>

                                  <div className="grid gap-3 lg:grid-cols-3">
                                    <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                      <p className="text-[13px] font-semibold text-[#1E293B]">Blockers</p>
                                      <ul className="mt-2 space-y-2 text-[12px] text-[#607B90]">
                                        {livePanel.platformHealth.blockers.length
                                          ? livePanel.platformHealth.blockers.map(item => (
                                              <li key={item.id}>{item.label}</li>
                                            ))
                                          : <li>No blocking checks.</li>}
                                      </ul>
                                    </div>
                                    <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                      <p className="text-[13px] font-semibold text-[#1E293B]">Warnings</p>
                                      <ul className="mt-2 space-y-2 text-[12px] text-[#607B90]">
                                        {livePanel.platformHealth.warnings.length
                                          ? livePanel.platformHealth.warnings.map(item => (
                                              <li key={item.id}>{item.label}</li>
                                            ))
                                          : <li>No configuration warnings.</li>}
                                      </ul>
                                    </div>
                                    <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                      <p className="text-[13px] font-semibold text-[#1E293B]">Configuration</p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {Object.entries(livePanel.platformHealth.configuration).map(([key, value]) => (
                                          <span
                                            key={key}
                                            className="inline-flex items-center rounded-full border border-[#D8E3EE] bg-[#FBFDFF] px-2.5 py-1 text-[11px] text-[#607B90]"
                                          >
                                            <span className="font-semibold text-[#1E293B]">
                                              {formatMetadataLabel(key)}
                                              :
                                            </span>
                                            <span className="ml-1">{String(value)}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <p className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-3 text-[12px] leading-5 text-[#607B90]">
                                    {livePanel.platformHealth.footerNote}
                                  </p>
                                </>
                              )
                            : null}
                          {!livePanel.platformHealth && !livePanel.isLoading
                            ? (
                                <div className="rounded-lg border border-[#D8E3EE] bg-white px-3 py-4 text-[12px] text-[#607B90]">
                                  Platform health data is not available yet.
                                </div>
                              )
                            : null}
                        </div>
                      )
                    : null}

                  {sectionKey === "analytics"
                    ? (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#607B90]">Overview</p>
                            <p className="mt-2 text-[28px] font-semibold text-[#1E293B]">
                              {livePanel.analyticsOverview?.totalReports ?? 0}
                            </p>
                            <p className="mt-2 text-[12px] text-[#607B90]">Anonymised reports counted in analytics-safe aggregation.</p>
                          </div>
                          <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#607B90]">Privacy Guard</p>
                            <p className="mt-2 text-[14px] font-semibold text-[#1E293B]">
                              {livePanel.analyticsOverview?.privacy?.anonymisedOnly ? "Anonymised only" : "Fallback"}
                            </p>
                            <p className="mt-2 text-[12px] text-[#607B90]">
                              Minimum cell suppression:
                              {" "}
                              {livePanel.analyticsOverview?.privacy?.minimumCellSuppression ?? "n/a"}
                            </p>
                            <button
                              type="button"
                              disabled={isSubmittingLiveChange}
                              onClick={() => void generateProtectedAnalyticsExport()}
                              className="mt-3 rounded-md border border-[#D8E3EE] px-3 py-2 text-[11px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSubmittingLiveChange ? "Generating..." : "Generate Protected Export"}
                            </button>
                          </div>
                          {livePanel.analyticsExport
                            ? (
                                <div className="rounded-xl border border-[#C7E5D3] bg-[#F0FDF4] px-4 py-3 lg:col-span-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#166534]">Protected Export Ready</p>
                                  <p className="mt-2 text-[13px] font-semibold text-[#1E293B]">
                                    Export {livePanel.analyticsExport.exportId}
                                  </p>
                                  <p className="mt-2 text-[12px] text-[#166534]">
                                    Differential privacy:
                                    {" "}
                                    {livePanel.analyticsExport.privacy.differentialPrivacy.mechanism}
                                    {" "}
                                    epsilon
                                    {" "}
                                    {livePanel.analyticsExport.privacy.differentialPrivacy.epsilon}
                                    {"; low-count cells are suppressed before noise is applied."}
                                  </p>
                                  <p className="mt-2 text-[12px] text-[#166534]">
                                    Exported report total:
                                    {" "}
                                    {livePanel.analyticsExport.summary.reports.label}
                                  </p>
                                </div>
                              )
                            : null}
                          <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                            <p className="text-[13px] font-semibold text-[#1E293B]">Top Categories</p>
                            <ul className="mt-2 space-y-2 text-[12px] text-[#607B90]">
                              {livePanel.analyticsCategories.slice(0, 5).map(item => (
                                <li key={`${item._id ?? "unknown"}-${item.count}`}>
                                  {String(item._id ?? "Unknown")}
                                  {" • "}
                                  {item.count}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                            <p className="text-[13px] font-semibold text-[#1E293B]">Language Signals</p>
                            <ul className="mt-2 space-y-2 text-[12px] text-[#607B90]">
                              {livePanel.analyticsLanguages.slice(0, 5).map(item => (
                                <li key={`${item._id ?? "unknown"}-${item.count}`}>
                                  {String(item._id ?? "Unknown")}
                                  {" • "}
                                  {item.count}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3 lg:col-span-2">
                            <p className="text-[13px] font-semibold text-[#1E293B]">Trend and Heatmap Buckets</p>
                            <p className="mt-2 text-[12px] text-[#607B90]">
                              {livePanel.analyticsTrends.length}
                              {" trend buckets • "}
                              {livePanel.analyticsHeatmap.length}
                              {" heatmap cells above threshold"}
                            </p>
                          </div>
                        </div>
                      )
                    : null}
                </div>
              )
            : null}

          {config.footerNote
            ? <div className="mt-5 rounded-xl border border-[#E5ECF3] bg-[#F8FBFF] px-4 py-3 text-sm text-[#52667A]">{config.footerNote}</div>
            : null}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <div className="mb-3">
            <h3 className="text-[18px] font-semibold text-[#1E293B]">Related Admin Areas</h3>
            <p className="mt-1 text-[12px] text-[#607B90]">These routes connect the current control to nearby operational workflows.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {config.quickLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 transition hover:border-[#0F67AE] hover:bg-[#EEF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
              >
                <p className="text-[14px] font-semibold text-[#1E293B]">{link.label}</p>
                <p className="mt-2 text-[12px] leading-5 text-[#607B90]">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <h3 className="text-[18px] font-semibold text-[#1E293B]">{config.watchlistTitle}</h3>
          <ul className="mt-3 space-y-2">
            {config.watchlist.map(item => (
              <li
                key={item}
                className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3 text-[13px] leading-6 text-[#475569]"
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
