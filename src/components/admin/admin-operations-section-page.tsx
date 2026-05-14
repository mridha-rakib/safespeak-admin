import type { ReactNode } from "react";

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  AdminAnalyticsBucket,
  AdminAnalyticsOverview,
  AdminDestinationRecord,
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
  getAdminTaxonomy,
  getAdminAnalyticsCategories,
  getAdminAnalyticsHeatmap,
  getAdminAnalyticsLanguages,
  getAdminAnalyticsOverview,
  getAdminAnalyticsTrends,
  listAdminReportDeliveries,
  listAdminDestinations,
  listAdminPrivacyRequests,
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
  | "analytics";

type LivePanelState = {
  isLoading: boolean;
  error: string | null;
  taxonomies: AdminTaxonomyRecord[];
  destinations: AdminDestinationRecord[];
  submissionTemplates: AdminSubmissionTemplateRecord[];
  privacyRequests: AdminPrivacyRequestRecord[];
  deliveries: AdminReportDeliveryRecord[];
  analyticsOverview: AdminAnalyticsOverview | null;
  analyticsHeatmap: AdminAnalyticsBucket[];
  analyticsTrends: AdminAnalyticsBucket[];
  analyticsCategories: AdminAnalyticsBucket[];
  analyticsLanguages: AdminAnalyticsBucket[];
};

type SubmissionTemplateDraft = Omit<
  AdminSubmissionTemplateRecord,
  "_id" | "fieldMappings" | "staticPayload" | "isActive" | "metadata"
> & {
  fieldMappings: string;
  staticPayload: string;
};

function parseCommaSeparatedValues(value: string) {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
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
  analyticsOverview: null,
  analyticsHeatmap: [],
  analyticsTrends: [],
  analyticsCategories: [],
  analyticsLanguages: [],
};

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

export function AdminOperationsSectionPage({
  config,
  sectionKey,
}: {
  config: AdminOperationsSectionConfig;
  sectionKey?: AdminOperationsSectionKey;
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
  const [destinationDraft, setDestinationDraft] = useState({
    type: "police" as AdminDestinationRecord["type"],
    key: "",
    name: "",
    channel: "secure_email" as AdminDestinationRecord["channel"],
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
  });
  const [submissionTemplateDraft, setSubmissionTemplateDraft] = useState<SubmissionTemplateDraft>({
    key: "",
    name: "",
    destinationType: "police" as AdminDestinationRecord["type"],
    channel: "secure_email" as AdminDestinationRecord["channel"],
    jurisdiction: "NSW",
    titleTemplate: "SafeSpeak report {{refNo}}",
    summaryTemplate: "{{summary}}",
    fieldMappings: "refNo:referenceId, incidentType:category, summary:description",
    staticPayload: "{}",
    acknowledgementMode: "manual" as const,
    attachmentMode: "metadata_only" as const,
  });
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
      if (sectionKey === "taxonomies") {
        const taxonomies = await listAdminTaxonomies();

        if (isMounted) {
          setLivePanel({
            ...defaultLivePanelState,
            isLoading: false,
            taxonomies,
          });
        }
        return;
      }

      if (sectionKey === "destinations") {
        const [destinations, submissionTemplates] = await Promise.all([
          listAdminDestinations(),
          listAdminSubmissionTemplates(),
        ]);

        if (isMounted) {
          setLivePanel({
            ...defaultLivePanelState,
            isLoading: false,
            destinations,
            submissionTemplates,
          });
        }
        return;
      }

      if (sectionKey === "privacyRequests") {
        const privacyRequests = await listAdminPrivacyRequests({ limit: 50 });

        if (isMounted) {
          setLivePanel({
            ...defaultLivePanelState,
            isLoading: false,
            privacyRequests,
          });
        }
        return;
      }

      if (sectionKey === "deliveries") {
        const deliveries = await listAdminReportDeliveries({ limit: 25 });

        if (isMounted) {
          setLivePanel({
            ...defaultLivePanelState,
            isLoading: false,
            deliveries,
          });
        }
        return;
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

      if (isMounted) {
        setLivePanel({
          ...defaultLivePanelState,
          isLoading: false,
          analyticsOverview,
          analyticsHeatmap,
          analyticsTrends,
          analyticsCategories,
          analyticsLanguages,
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

  const visibleTaxonomies = useMemo(
    () => livePanel.taxonomies.filter(item => item.type === taxonomyDraft.type),
    [livePanel.taxonomies, taxonomyDraft.type],
  );
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
      const destination = await createAdminDestination({
        type: destinationDraft.type,
        key: destinationDraft.key,
        name: destinationDraft.name,
        channel: destinationDraft.channel,
        jurisdiction: destinationDraft.jurisdiction,
        languages: parseCommaSeparatedValues(destinationDraft.languages),
        endpoint: destinationDraft.endpoint || undefined,
        contactEmail: destinationDraft.contactEmail || undefined,
        contactPhone: destinationDraft.contactPhone || undefined,
        minimumRequiredInfo: parseCommaSeparatedValues(destinationDraft.minimumRequiredInfo),
        anonymityOptions: parseCommaSeparatedValues(destinationDraft.anonymityOptions),
        expectedNextSteps: parseCommaSeparatedValues(destinationDraft.expectedNextSteps),
        consentRequired: destinationDraft.consentRequired,
        supportsAcknowledgement: destinationDraft.supportsAcknowledgement,
        isActive: true,
        metadata: {
          requiredConsentFlags: parseCommaSeparatedValues(destinationDraft.requiredConsentFlags),
          incidentTypes: parseCommaSeparatedValues(destinationDraft.incidentTypes),
          recommendationReason: destinationDraft.recommendationReason || undefined,
          submissionTitleTemplate: destinationDraft.submissionTitleTemplate || undefined,
          submissionSummaryTemplate: destinationDraft.submissionSummaryTemplate || undefined,
        },
      });

      setLivePanel(prev => ({
        ...prev,
        destinations: [destination, ...prev.destinations],
        error: null,
      }));
      setDestinationDraft({
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
      });
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to create destination.",
      }));
    }
    finally {
      setIsSubmittingLiveChange(false);
    }
  };

  const handleSubmissionTemplateCreate = async () => {
    setIsSubmittingLiveChange(true);

    try {
      const template = await createAdminSubmissionTemplate({
        key: submissionTemplateDraft.key,
        name: submissionTemplateDraft.name,
        destinationType: submissionTemplateDraft.destinationType,
        channel: submissionTemplateDraft.channel,
        jurisdiction: submissionTemplateDraft.jurisdiction,
        titleTemplate: submissionTemplateDraft.titleTemplate,
        summaryTemplate: submissionTemplateDraft.summaryTemplate,
        fieldMappings: parseCommaSeparatedValues(submissionTemplateDraft.fieldMappings).map((item) => {
          const [source, target] = item.split(":").map(part => part.trim());

          return {
            source,
            target: target || source,
            required: false,
          };
        }),
        staticPayload: JSON.parse(submissionTemplateDraft.staticPayload || "{}") as Record<string, unknown>,
        acknowledgementMode: submissionTemplateDraft.acknowledgementMode,
        attachmentMode: submissionTemplateDraft.attachmentMode,
        isActive: true,
        metadata: {},
      });

      setLivePanel(prev => ({
        ...prev,
        submissionTemplates: [template, ...prev.submissionTemplates],
        error: null,
      }));
      setSubmissionTemplateDraft({
        key: "",
        name: "",
        destinationType: "police",
        channel: "secure_email",
        jurisdiction: "NSW",
        titleTemplate: "SafeSpeak report {{refNo}}",
        summaryTemplate: "{{summary}}",
        fieldMappings: "refNo:referenceId, incidentType:category, summary:description",
        staticPayload: "{}",
        acknowledgementMode: "manual",
        attachmentMode: "metadata_only",
      });
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to create submission template.",
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
              onClick={() => setActiveModule(activeModule.id)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-4 text-[13px] font-semibold text-[#0F67AE] transition hover:bg-[#F3F8FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
            >
              Refresh Focus
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
                        {sectionKey === "taxonomies"
                          ? "Manage active incident, support, language, and culture taxonomy records."
                          : sectionKey === "destinations"
                            ? "Review live destination routing records for agencies and services."
                            : sectionKey === "privacyRequests"
                              ? "Update privacy request review state from the live backend queue."
                              : sectionKey === "deliveries"
                                ? "Monitor consent-gated delivery attempts without exposing raw payloads."
                                : "Review anonymised analytics aggregates returned by the backend analytics module."}
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
                                onChange={event => {
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
                                                      <span className="font-semibold text-[#1E293B]">{formatMetadataLabel(key)}:</span>
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
                                        Report {item.reportId} · Template {item.templateKey ?? "default"}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-[#EEF6FF] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0F67AE]">
                                      {item.status}
                                    </span>
                                  </div>
                                  <div className="mt-3 grid gap-2 text-[11px] text-[#52667A] md:grid-cols-3">
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">External ref</span>
                                      <p>{item.externalReference ?? "Not received"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Artifacts</span>
                                      <p>{item.hasDeliveryArtifacts ? "Available" : "None"}</p>
                                    </div>
                                    <div className="rounded-lg border border-[#E5ECF3] bg-[#FBFDFF] px-3 py-2">
                                      <span className="font-semibold text-[#1E293B]">Consent flags</span>
                                      <p>{item.requiredConsentFlags.join(", ") || "None"}</p>
                                    </div>
                                  </div>
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

                  {sectionKey === "destinations"
                    ? (
                        <div className="mt-4 space-y-4">
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
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                              <span>Submission Title Template</span>
                              <input
                                value={destinationDraft.submissionTitleTemplate}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, submissionTitleTemplate: event.target.value }))}
                                placeholder="SafeSpeak report {{refNo}}"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                            <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                              <span>Submission Summary Template</span>
                              <input
                                value={destinationDraft.submissionSummaryTemplate}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, submissionSummaryTemplate: event.target.value }))}
                                placeholder="{{summary}}"
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
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
                            {isSubmittingLiveChange ? "Saving..." : "Create destination"}
                          </button>
                          <div className="grid gap-3">
                            {livePanel.destinations.slice(0, 8).map(item => (
                              <div key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-[14px] font-semibold text-[#1E293B]">{item.name}</p>
                                    <p className="mt-1 text-[12px] text-[#607B90]">
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
                                  <button
                                    type="button"
                                    onClick={() => void toggleDestinationActive(item)}
                                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                  >
                                    {item.isActive ? "Deactivate" : "Activate"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6 border-t border-[#E5ECF3] pt-4">
                            <div className="flex flex-col gap-1">
                              <h5 className="text-[15px] font-semibold text-[#1E293B]">Submission Templates</h5>
                              <p className="text-[12px] text-[#607B90]">
                                Define explicit payload mappings and acknowledgement modes for each delivery channel.
                              </p>
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
                              <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2 xl:col-span-4">
                                <span>Title Template</span>
                                <input
                                  value={submissionTemplateDraft.titleTemplate}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({ ...prev, titleTemplate: event.target.value }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2 xl:col-span-4">
                                <span>Summary Template</span>
                                <input
                                  value={submissionTemplateDraft.summaryTemplate}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({ ...prev, summaryTemplate: event.target.value }))}
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                                <span>Field Mappings</span>
                                <input
                                  value={submissionTemplateDraft.fieldMappings}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({ ...prev, fieldMappings: event.target.value }))}
                                  placeholder="refNo:referenceId, summary:description"
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                              </label>
                              <label className="space-y-1 text-[12px] text-[#52667A] md:col-span-2">
                                <span>Static Payload JSON</span>
                                <input
                                  value={submissionTemplateDraft.staticPayload}
                                  onChange={event => setSubmissionTemplateDraft(prev => ({ ...prev, staticPayload: event.target.value }))}
                                  placeholder='{"source":"safespeak"}'
                                  className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                                />
                              </label>
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
                              {isSubmittingLiveChange ? "Saving..." : "Create template"}
                            </button>
                            <div className="mt-3 grid gap-3">
                              {livePanel.submissionTemplates.slice(0, 8).map(item => (
                                <div key={item._id} className="rounded-xl border border-[#E5ECF3] bg-white px-4 py-3">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-[14px] font-semibold text-[#1E293B]">{item.name}</p>
                                      <p className="mt-1 text-[12px] text-[#607B90]">
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
                                    <button
                                      type="button"
                                      onClick={() => void toggleSubmissionTemplateActive(item)}
                                      className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                    >
                                      {item.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                  </div>
                                </div>
                              ))}
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
                          </div>
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
