import type { ReactNode } from "react";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  Layers3,
  Link2,
  ListFilter,
  Loader2,
  Mail,
  Phone,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Shield,
  Tags,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AdminSupportServiceRecord, AdminWarmReferralRecord } from "@/lib/admin-operations";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createAdminSupportService,
  deleteAdminSupportService,
  listAdminSupportServices,
  listAdminWarmReferrals,
  patchAdminSupportService,
  patchAdminWarmReferral,
} from "@/lib/admin-operations";
import { cn } from "@/lib/utils";

const SUPPORT_TYPES: AdminSupportServiceRecord["type"][] = [
  "counselling",
  "legal_information",
  "housing",
  "financial",
  "crisis",
  "community",
  "health",
  "online_safety",
];

const CARD_ICONS: AdminSupportServiceRecord["cardIcon"][] = [
  "scale",
  "shield",
  "phone",
  "community",
  "counselling",
  "home",
  "bell",
  "sparkles",
];

const OVERLAY_TONES: AdminSupportServiceRecord["cardOverlayTone"][] = [
  "default",
  "dark",
  "blue",
  "red",
  "brown",
  "purple",
];

const RESOURCE_TYPES: AdminSupportServiceRecord["resourceType"][] = [
  "emergency",
  "police",
  "government",
  "legal",
  "mental_health",
  "domestic_violence_agency",
  "workplace_body",
  "anti_discrimination_body",
  "council_support",
  "evidence_guidance",
  "safety_planning",
  "scam_support",
  "online_safety",
];

const ISSUE_TYPES: AdminSupportServiceRecord["issueTypes"][number][] = [
  "domestic_violence",
  "workplace_bullying",
  "racism_discrimination",
  "online_abuse",
  "scam_fraud",
  "theft_property",
  "harassment",
  "mental_health_distress",
  "general_support",
];

const SAFETY_RISK_LEVELS: AdminSupportServiceRecord["safetyRiskLevels"][number][] = [
  "low",
  "medium",
  "high",
  "immediate",
  "all",
];

const SERVICE_FORM_STEPS = [
  {
    title: "Basics",
    description: "Name, category, and the short public description.",
  },
  {
    title: "Card Display",
    description: "Visual treatment shown in the support explorer.",
  },
  {
    title: "Referral Resources",
    description: "Availability, referral copy, and resource links.",
  },
  {
    title: "Coverage",
    description: "Jurisdiction, regions, languages, and tags.",
  },
  {
    title: "Contact & Status",
    description: "Contact methods, publishing state, and activation.",
  },
] as const;

const SERVICE_PREVIEW_TAB_CONFIG = [
  { value: "overview", label: "Overview", icon: ClipboardList },
  { value: "details", label: "Details", icon: FileText },
  { value: "tags & filters", label: "Tags & Filters", icon: Tags },
  { value: "links", label: "Links", icon: Link2 },
  { value: "activity log", label: "Activity Log", icon: Activity },
] as const;

type ServicePreviewTab = (typeof SERVICE_PREVIEW_TAB_CONFIG)[number]["value"];

const REFERRAL_STATUS_FILTERS = [
  { value: "all", label: "All", icon: ListFilter },
  { value: "pending", label: "Pending", icon: Clock3 },
  { value: "accepted", label: "Accepted", icon: CheckCircle2 },
  { value: "completed", label: "Completed", icon: ClipboardCheck },
  { value: "cancelled", label: "Cancelled", icon: XCircle },
] as const;

type ReferralStatusFilter = (typeof REFERRAL_STATUS_FILTERS)[number]["value"];

const REFERRAL_STATUS_ACTIONS = [
  { status: "accepted", label: "Accept", icon: CheckCircle2 },
  { status: "completed", label: "Complete", icon: ClipboardCheck },
  { status: "cancelled", label: "Cancel", icon: XCircle },
] as const;

type SupportServiceDraft = Omit<
  AdminSupportServiceRecord,
  | "_id"
  | "id"
  | "createdAt"
  | "updatedAt"
  | "regions"
  | "languages"
  | "eligibility"
  | "issueTypes"
  | "safetyRiskLevels"
  | "metadata"
  | "resourceLinks"
> & {
  regions: string;
  languages: string;
  eligibility: string;
  issueTypes: string;
  safetyRiskLevels: string;
  profiles: string;
  resourceLinks: string;
};

const emptyDraft: SupportServiceDraft = {
  key: "",
  name: "",
  type: "counselling",
  description: "",
  cardImageUrl: "",
  cardImageAlt: "",
  cardIcon: "shield",
  cardOverlayTone: "default",
  availabilityLabel: "Available Now",
  referralTitle: "Warm Referral",
  referralDescription:
    "A warm referral ensures the provider has the context they need to help you immediately without repeating your story. This secure transfer of information helps build trust and accelerates the support process.",
  resourceType: "government",
  issueTypes: "general_support",
  safetyRiskLevels: "all",
  ctaLabel: "View options",
  resourceLinks: "",
  jurisdiction: "AU",
  regions: "national",
  languages: "en",
  eligibility: "",
  profiles: "",
  bookingUrl: "",
  websiteUrl: "",
  phone: "",
  email: "",
  address: "",
  crisis: false,
  informationOnly: true,
  priority: 50,
  safetyNotes: "",
  eligibilityNotes: "",
  languageSupportNotes: "",
  isPublished: false,
  isActive: true,
  sortOrder: 0,
};

function parseCommaSeparatedValues(value: string) {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function parseResourceLinks(value: string) {
  return value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, ...urlParts] = item.split("|");

      return {
        label: label?.trim() ?? "",
        url: urlParts.join("|").trim(),
      };
    })
    .filter(item => item.label && item.url);
}

function stringifyResourceLinks(links?: Array<{ label: string; url: string }>) {
  return (links ?? []).map(link => `${link.label} | ${link.url}`).join("\n");
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeServiceRecord(service: AdminSupportServiceRecord): AdminSupportServiceRecord {
  return {
    ...service,
    regions: asStringArray(service.regions),
    languages: asStringArray(service.languages),
    eligibility: asStringArray(service.eligibility),
    cardIcon: service.cardIcon ?? "shield",
    cardOverlayTone: service.cardOverlayTone ?? "default",
    availabilityLabel: service.availabilityLabel ?? "Available Now",
    referralTitle: service.referralTitle ?? "Warm Referral",
    referralDescription: service.referralDescription ?? emptyDraft.referralDescription,
    resourceType: service.resourceType ?? "government",
    issueTypes: asStringArray(service.issueTypes) as AdminSupportServiceRecord["issueTypes"],
    safetyRiskLevels: asStringArray(service.safetyRiskLevels) as AdminSupportServiceRecord["safetyRiskLevels"],
    ctaLabel: service.ctaLabel ?? "View options",
    resourceLinks: Array.isArray(service.resourceLinks) ? service.resourceLinks : [],
    priority: typeof service.priority === "number" ? service.priority : 50,
  };
}

function normalizeReferralRecord(referral: AdminWarmReferralRecord): AdminWarmReferralRecord {
  return {
    ...referral,
    includedFields: asStringArray(referral.includedFields),
  };
}

function toDraft(service: AdminSupportServiceRecord): SupportServiceDraft {
  const normalizedService = normalizeServiceRecord(service);
  const profiles = Array.isArray(service.metadata?.profiles)
    ? (service.metadata.profiles as unknown[]).filter((item): item is string => typeof item === "string")
    : [];

  return {
    key: normalizedService.key,
    name: normalizedService.name,
    type: normalizedService.type,
    description: normalizedService.description,
    cardImageUrl: normalizedService.cardImageUrl ?? "",
    cardImageAlt: normalizedService.cardImageAlt ?? "",
    cardIcon: normalizedService.cardIcon,
    cardOverlayTone: normalizedService.cardOverlayTone,
    availabilityLabel: normalizedService.availabilityLabel,
    referralTitle: normalizedService.referralTitle,
    referralDescription: normalizedService.referralDescription,
    resourceType: normalizedService.resourceType,
    issueTypes: normalizedService.issueTypes.join(", "),
    safetyRiskLevels: normalizedService.safetyRiskLevels.join(", "),
    ctaLabel: normalizedService.ctaLabel,
    resourceLinks: stringifyResourceLinks(normalizedService.resourceLinks),
    jurisdiction: normalizedService.jurisdiction,
    regions: normalizedService.regions.join(", "),
    languages: normalizedService.languages.join(", "),
    eligibility: normalizedService.eligibility.join(", "),
    profiles: profiles.join(", "),
    bookingUrl: normalizedService.bookingUrl ?? "",
    websiteUrl: normalizedService.websiteUrl ?? "",
    phone: normalizedService.phone ?? "",
    email: normalizedService.email ?? "",
    address: normalizedService.address ?? "",
    crisis: normalizedService.crisis,
    informationOnly: normalizedService.informationOnly,
    priority: normalizedService.priority,
    safetyNotes: normalizedService.safetyNotes ?? "",
    eligibilityNotes: normalizedService.eligibilityNotes ?? "",
    languageSupportNotes: normalizedService.languageSupportNotes ?? "",
    isPublished: normalizedService.isPublished,
    isActive: normalizedService.isActive,
    sortOrder: normalizedService.sortOrder,
  };
}

function buildServicePayload(draft: SupportServiceDraft) {
  return {
    key: draft.key,
    name: draft.name,
    type: draft.type,
    description: draft.description,
    cardImageUrl: draft.cardImageUrl || undefined,
    cardImageAlt: draft.cardImageAlt || undefined,
    cardIcon: draft.cardIcon,
    cardOverlayTone: draft.cardOverlayTone,
    availabilityLabel: draft.availabilityLabel,
    referralTitle: draft.referralTitle,
    referralDescription: draft.referralDescription,
    resourceType: draft.resourceType,
    issueTypes: parseCommaSeparatedValues(draft.issueTypes) as AdminSupportServiceRecord["issueTypes"],
    safetyRiskLevels: parseCommaSeparatedValues(draft.safetyRiskLevels) as AdminSupportServiceRecord["safetyRiskLevels"],
    ctaLabel: draft.ctaLabel,
    resourceLinks: parseResourceLinks(draft.resourceLinks),
    jurisdiction: draft.jurisdiction,
    regions: parseCommaSeparatedValues(draft.regions),
    languages: parseCommaSeparatedValues(draft.languages),
    eligibility: parseCommaSeparatedValues(draft.eligibility),
    bookingUrl: draft.bookingUrl || undefined,
    websiteUrl: draft.websiteUrl || undefined,
    phone: draft.phone || undefined,
    email: draft.email || undefined,
    address: draft.address || undefined,
    crisis: draft.crisis,
    informationOnly: draft.informationOnly,
    priority: Number(draft.priority) || 0,
    safetyNotes: draft.safetyNotes || undefined,
    eligibilityNotes: draft.eligibilityNotes || undefined,
    languageSupportNotes: draft.languageSupportNotes || undefined,
    isPublished: draft.isPublished,
    isActive: draft.isActive,
    sortOrder: Number(draft.sortOrder) || 0,
    metadata: {
      profiles: parseCommaSeparatedValues(draft.profiles),
    },
  };
}

function formatType(value: string) {
  return value.replace(/_/g, " ");
}

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString() : "Not set";
}

function formatReferralStatus(status: AdminWarmReferralRecord["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDisplayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "None";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value.trim() || "Not set";
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return "Not set";
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        active ? "bg-[#DFF4E8] text-[#0F7A43]" : "bg-[#FFF4E5] text-[#B45309]",
      )}
    >
      {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[12px] font-semibold text-[#486176]">{children}</span>;
}

function DetailGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <div className="grid gap-x-16 gap-y-4 px-5 py-6 text-sm sm:grid-cols-2 sm:px-6">
      {items.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
          <span className="text-xs font-bold text-[#6B8196]">{label}</span>
          <span className="text-sm font-semibold text-[#244961]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function TagList({ emptyLabel = "None", items }: { emptyLabel?: string; items: string[] }) {
  if (!items.length) {
    return <span className="text-sm font-semibold text-[#607B90]">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span
          key={item}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF6FF] px-3 py-1 text-[11px] font-semibold text-[#0A66A8]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function getReferralServiceQueryId(service: AdminSupportServiceRecord) {
  return service.id ?? service.key ?? service._id;
}

function ReferralStatusBadge({ status }: { status: AdminWarmReferralRecord["status"] }) {
  const Icon = {
    accepted: CheckCircle2,
    cancelled: XCircle,
    completed: ClipboardCheck,
    pending: Clock3,
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold",
        status === "pending" ? "bg-[#FFF4E5] text-[#B45309]" : "",
        status === "accepted" ? "bg-[#EEF6FF] text-[#0A66A8]" : "",
        status === "completed" ? "bg-[#DFF4E8] text-[#0F7A43]" : "",
        status === "cancelled" ? "bg-[#FFF1F1] text-[#B42318]" : "",
      )}
    >
      <Icon className="h-3 w-3" />
      {formatReferralStatus(status)}
    </span>
  );
}

function ReferralActivityCard({
  className,
  isUpdating,
  onStatusChange,
  pendingStatus,
  referral,
}: {
  className: string;
  isUpdating: boolean;
  onStatusChange: (
    referral: AdminWarmReferralRecord,
    status: AdminWarmReferralRecord["status"],
  ) => void;
  pendingStatus?: AdminWarmReferralRecord["status"];
  referral: AdminWarmReferralRecord;
}) {
  return (
    <article className={className}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#0B1F33]">
              {referral.serviceName ?? referral.serviceId}
            </h3>
            <ReferralStatusBadge status={referral.status} />
            <span className="rounded-full bg-[#F6FAFD] px-2 py-1 text-[11px] font-semibold text-[#244961]">
              {referral.contactPreference}
            </span>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#526B80]">
            {referral.minimalSummary?.incidentSummary
              ?? "No incident summary was included in this referral."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#244961]">
            <span>
              Contact:
              {" "}
              {referral.safeContactMasked ?? "withheld"}
            </span>
            <span>
              Consent:
              {" "}
              {referral.consentSnapshot?.warm_referral ? "yes" : "missing"}
            </span>
            <span>
              Fields:
              {" "}
              {referral.includedFields.length > 0 ? referral.includedFields.join(", ") : "none"}
            </span>
            {referral.createdAt ? <span>{formatDateTime(referral.createdAt)}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {REFERRAL_STATUS_ACTIONS.map(({ icon: Icon, label, status }) => {
            const isCurrent = referral.status === status;
            const isPending = pendingStatus === status;

            return (
              <button
                key={status}
                aria-label={`${label} referral for ${referral.serviceName ?? referral.serviceId}`}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-[7px] border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                  isCurrent
                    ? "border-[#B8DFC8] bg-[#F1FBF5] text-[#0F7A43]"
                    : "border-[#C9DAE8] text-[#244961] hover:bg-[#F5FAFF]",
                )}
                disabled={isUpdating || isCurrent}
                onClick={() => onStatusChange(referral, status)}
                type="button"
              >
                {isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Icon className="h-3.5 w-3.5" />}
                {isPending ? "Updating" : isCurrent ? formatReferralStatus(status) : label}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function AdminSupportServicesPage() {
  const [services, setServices] = useState<AdminSupportServiceRecord[]>([]);
  const [referrals, setReferrals] = useState<AdminWarmReferralRecord[]>([]);
  const [selectedServiceReferrals, setSelectedServiceReferrals] = useState<AdminWarmReferralRecord[]>([]);
  const [draft, setDraft] = useState<SupportServiceDraft>(emptyDraft);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<"all" | AdminSupportServiceRecord["resourceType"]>("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState<"all" | AdminSupportServiceRecord["issueTypes"][number]>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "active" | "inactive">("all");
  const [activePreviewTab, setActivePreviewTab] = useState<ServicePreviewTab>("overview");
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"services" | "activity">("services");
  const [activityStatusFilter, setActivityStatusFilter] = useState<ReferralStatusFilter>("all");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [activeFormStep, setActiveFormStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [isLoadingServiceActivity, setIsLoadingServiceActivity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingReferralAction, setUpdatingReferralAction] = useState<{
    id: string;
    status: AdminWarmReferralRecord["status"];
  } | null>(null);
  const [activityMessage, setActivityMessage] = useState<string | null>(null);
  const [serviceActivityMessage, setServiceActivityMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([listAdminSupportServices(), listAdminWarmReferrals({ limit: 25 })])
      .then(([serviceResult, referralResult]) => {
        if (isMounted) {
          setServices(serviceResult.map(normalizeServiceRecord));
          setReferrals(referralResult.map(normalizeReferralRecord));
          setMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Unable to load support services.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!editingServiceId || activePreviewTab !== "activity log") {
      setSelectedServiceReferrals([]);
      setServiceActivityMessage(null);
      setIsLoadingServiceActivity(false);
      return;
    }

    const service = services.find(item => item._id === editingServiceId);
    const referralServiceId = service ? getReferralServiceQueryId(service) : editingServiceId;
    let isMounted = true;

    setIsLoadingServiceActivity(true);
    setServiceActivityMessage(null);
    setSelectedServiceReferrals([]);

    void listAdminWarmReferrals({ serviceId: referralServiceId, limit: 50 })
      .then((result) => {
        if (isMounted) {
          setSelectedServiceReferrals(result.map(normalizeReferralRecord));
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setSelectedServiceReferrals([]);
          setServiceActivityMessage(error instanceof Error ? error.message : "Unable to load service activity.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingServiceActivity(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activePreviewTab, editingServiceId, services]);

  const filteredServices = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    return services.filter((service) => {
      const normalizedService = normalizeServiceRecord(service);
      const matchesSearch = !normalizedFilter || [
        normalizedService.name,
        normalizedService.key,
        normalizedService.type,
        normalizedService.resourceType,
        normalizedService.jurisdiction,
        ...normalizedService.issueTypes,
        ...normalizedService.eligibility,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedFilter);
      const matchesResourceType =
        resourceTypeFilter === "all" || normalizedService.resourceType === resourceTypeFilter;
      const matchesIssueType =
        issueTypeFilter === "all" || normalizedService.issueTypes.includes(issueTypeFilter);
      const matchesJurisdiction =
        jurisdictionFilter === "all" || normalizedService.jurisdiction === jurisdictionFilter;
      const matchesStatus =
        statusFilter === "all"
          || (statusFilter === "published" && normalizedService.isPublished)
          || (statusFilter === "draft" && !normalizedService.isPublished)
          || (statusFilter === "active" && normalizedService.isActive)
          || (statusFilter === "inactive" && !normalizedService.isActive);

      return matchesSearch && matchesResourceType && matchesIssueType && matchesJurisdiction && matchesStatus;
    });
  }, [filter, issueTypeFilter, jurisdictionFilter, resourceTypeFilter, services, statusFilter]);

  const updateDraft = <K extends keyof SupportServiceDraft>(
    key: K,
    value: SupportServiceDraft[K],
  ) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const service = normalizeServiceRecord(editingServiceId
        ? await patchAdminSupportService(editingServiceId, buildServicePayload(draft))
        : await createAdminSupportService(buildServicePayload(draft)));

      setServices(prev =>
        editingServiceId
          ? prev.map(item => (item._id === service._id ? service : item))
          : [service, ...prev],
      );
      setDraft(emptyDraft);
      setEditingServiceId(null);
      setActiveFormStep(0);
      setIsServiceModalOpen(false);
      setMessage(editingServiceId ? "Support service updated." : "Support service saved.");
    }
    catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save support service.");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (service: AdminSupportServiceRecord) => {
    setDraft(toDraft(service));
    setEditingServiceId(service._id);
    setActiveFormStep(0);
    setIsServiceModalOpen(true);
    setMessage(null);
  };

  const handleView = (service: AdminSupportServiceRecord) => {
    setDraft(toDraft(service));
    setEditingServiceId(service._id);
    setActivePreviewTab("overview");
    setActiveFormStep(0);
    setIsServiceModalOpen(false);
    setMessage(null);
  };

  const handleStartNewService = () => {
    setEditingServiceId(null);
    setDraft(emptyDraft);
    setActiveFormStep(0);
    setIsServiceModalOpen(true);
    setMessage(null);
  };

  const handleCloseServiceView = () => {
    setEditingServiceId(null);
    setDraft(emptyDraft);
    setActivePreviewTab("overview");
    setActiveFormStep(0);
  };

  const handleServiceModalOpenChange = (open: boolean) => {
    setIsServiceModalOpen(open);

    if (!open) {
      setActiveFormStep(0);
    }
  };

  const handleContinue = () => {
    setActiveFormStep(prev => Math.min(prev + 1, SERVICE_FORM_STEPS.length - 1));
  };

  const handleBack = () => {
    setActiveFormStep(prev => Math.max(prev - 1, 0));
  };

  const handleDelete = async (service: AdminSupportServiceRecord) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Delete "${service.name}"?`);

    if (!confirmed) {
      return;
    }

    await deleteAdminSupportService(service._id);
    setServices(prev => prev.filter(item => item._id !== service._id));

    if (editingServiceId === service._id) {
      setEditingServiceId(null);
      setDraft(emptyDraft);
    }

    setMessage("Support service deleted.");
  };

  const handleToggle = async (
    service: AdminSupportServiceRecord,
    field: "isPublished" | "isActive",
  ) => {
    const updated = normalizeServiceRecord(
      await patchAdminSupportService(service._id, { [field]: !service[field] }),
    );

    setServices(prev => prev.map(item => (item._id === updated._id ? updated : item)));

    if (editingServiceId === updated._id) {
      setDraft(toDraft(updated));
    }
  };

  const refreshOverallActivity = async (statusFilter: ReferralStatusFilter = activityStatusFilter) => {
    setIsLoadingReferrals(true);
    setActivityMessage(null);

    try {
      const result = await listAdminWarmReferrals({
        limit: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setReferrals(result.map(normalizeReferralRecord));
    }
    catch (error) {
      setReferrals([]);
      setActivityMessage(error instanceof Error ? error.message : "Unable to load referral activity.");
    }
    finally {
      setIsLoadingReferrals(false);
    }
  };

  const handleReferralStatus = async (
    referral: AdminWarmReferralRecord,
    status: AdminWarmReferralRecord["status"],
  ) => {
    if (referral.status === status || updatingReferralAction) {
      return;
    }

    setUpdatingReferralAction({ id: referral._id, status });
    setActivityMessage(null);
    setServiceActivityMessage(null);

    try {
      const updated = normalizeReferralRecord(await patchAdminWarmReferral(referral._id, { status }));

      setReferrals(prev => prev
        .map(item => (item._id === updated._id ? updated : item))
        .filter(item => activityStatusFilter === "all" || item.status === activityStatusFilter));
      setSelectedServiceReferrals(prev => prev.map(item => (item._id === updated._id ? updated : item)));
      setMessage(`Warm referral marked ${formatReferralStatus(status).toLowerCase()}.`);
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to update warm referral.";

      setActivityMessage(errorMessage);
      setServiceActivityMessage(errorMessage);
    }
    finally {
      setUpdatingReferralAction(null);
    }
  };

  const previewLinks = parseResourceLinks(draft.resourceLinks);
  const previewEligibility = parseCommaSeparatedValues(draft.eligibility);
  const previewIssueTypes = parseCommaSeparatedValues(draft.issueTypes);
  const previewRegions = parseCommaSeparatedValues(draft.regions);
  const previewSafetyRiskLevels = parseCommaSeparatedValues(draft.safetyRiskLevels);
  const previewLanguages = parseCommaSeparatedValues(draft.languages);
  const previewProfiles = parseCommaSeparatedValues(draft.profiles);
  const selectedService = editingServiceId
    ? services.find(service => service._id === editingServiceId)
    : undefined;
  const refreshSelectedServiceActivity = async () => {
    if (!selectedService) {
      return;
    }

    setIsLoadingServiceActivity(true);
    setServiceActivityMessage(null);

    try {
      const result = await listAdminWarmReferrals({
        serviceId: getReferralServiceQueryId(selectedService),
        limit: 100,
      });

      setSelectedServiceReferrals(result.map(normalizeReferralRecord));
    }
    catch (error) {
      setSelectedServiceReferrals([]);
      setServiceActivityMessage(error instanceof Error ? error.message : "Unable to load service activity.");
    }
    finally {
      setIsLoadingServiceActivity(false);
    }
  };
  const serviceMetadataEntries = selectedService?.metadata
    ? Object.entries(selectedService.metadata).filter(([, value]) => value !== undefined && value !== null && value !== "")
    : [];
  const currentFormStep = SERVICE_FORM_STEPS[activeFormStep];
  const isFinalFormStep = activeFormStep === SERVICE_FORM_STEPS.length - 1;
  return (
    <div className="space-y-6">
      <section className="rounded-[16px] border border-[#D8E5F0] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0A66A8]">
              Crisis & Safety
            </p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#0B1F33]">
              Support Services Directory
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#526B80]">
              Manage published support resources that appear in the user support explorer and
              recommendation flow.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <label className="relative w-full xl:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA0B5]" />
              <input
                className="h-11 w-full rounded-[10px] border border-[#C9DAE8] bg-[#FBFDFF] pl-9 pr-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8] focus:bg-white"
                placeholder="Search services..."
                value={filter}
                onChange={event => setFilter(event.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={handleStartNewService}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0A66A8] px-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(10,102,168,0.18)] transition hover:bg-[#07588F]"
            >
              <Plus className="h-4 w-4" />
              Add New Service
            </button>
          </div>
        </div>
      </section>

      {message
        ? (
            <div className="rounded-[12px] border border-[#CBE0F2] bg-[#F8FBFE] px-4 py-3 text-sm font-medium text-[#244961]">
              {message}
            </div>
          )
        : null}

      <Dialog open={isServiceModalOpen} onOpenChange={handleServiceModalOpenChange}>
        <DialogContent
          showCloseButton={!isSubmitting}
          className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-[16px] border border-[#D8E5F0] bg-white p-0 text-[#0B1F33] shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-w-[900px]"
        >
          <DialogHeader className="border-b border-[#E4ECF3] px-5 py-5 sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A66A8]">
              Add/Edit Service Flow
            </p>
            <DialogTitle className="text-2xl font-bold text-[#0B1F33]">
              {editingServiceId ? "Edit support service" : "Add new service"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#526B80]">
              {currentFormStep.description}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 border-b border-[#E4ECF3] bg-[#F8FBFE] px-5 py-4 sm:grid-cols-5 sm:px-6">
            {SERVICE_FORM_STEPS.map((step, index) => {
              const isCurrent = index === activeFormStep;
              const isComplete = index < activeFormStep;

              return (
                <div
                  key={step.title}
                  className={cn(
                    "min-w-0 rounded-[10px] border px-3 py-2",
                    isCurrent
                      ? "border-[#0A66A8] bg-white shadow-[0_4px_12px_rgba(10,102,168,0.12)]"
                      : isComplete
                        ? "border-[#B8DFC8] bg-[#F1FBF5]"
                        : "border-[#D8E5F0] bg-white",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isCurrent
                          ? "bg-[#0A66A8] text-white"
                          : isComplete
                            ? "bg-[#13A463] text-white"
                            : "bg-[#EAF2F8] text-[#607B90]",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate text-xs font-bold text-[#244961]">{step.title}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-y-auto px-5 py-5 sm:px-6">
            {activeFormStep === 0
              ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <FieldLabel>Key</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="nsw-legal-aid"
                        value={draft.key}
                        onChange={event => updateDraft("key", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Service Name</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="Legal Aid NSW"
                        value={draft.name}
                        onChange={event => updateDraft("name", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Category</FieldLabel>
                      <div className="grid gap-4 md:grid-cols-2">
                        <select
                          className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm capitalize text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.type}
                          onChange={event =>
                            updateDraft("type", event.target.value as AdminSupportServiceRecord["type"])}
                        >
                          {SUPPORT_TYPES.map(type => (
                            <option key={type} value={type}>
                              {formatType(type)}
                            </option>
                          ))}
                        </select>
                        <select
                          className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm capitalize text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.resourceType}
                          onChange={event =>
                            updateDraft("resourceType", event.target.value as AdminSupportServiceRecord["resourceType"])}
                        >
                          {RESOURCE_TYPES.map(type => (
                            <option key={type} value={type}>
                              {formatType(type)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Issue Types</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="domestic_violence, general_support"
                        value={draft.issueTypes}
                        onChange={event => updateDraft("issueTypes", event.target.value)}
                        list="support-issue-type-options"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>CTA Label</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="Call 1800RESPECT"
                        value={draft.ctaLabel}
                        onChange={event => updateDraft("ctaLabel", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Short Description</FieldLabel>
                      <textarea
                        className="min-h-24 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="Short user-facing description"
                        value={draft.description}
                        onChange={event => updateDraft("description", event.target.value)}
                      />
                    </label>
                  </div>
                )
              : null}

            {activeFormStep === 1
              ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <FieldLabel>Shield Icon</FieldLabel>
                      <select
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm capitalize text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.cardIcon}
                        onChange={event =>
                          updateDraft("cardIcon", event.target.value as AdminSupportServiceRecord["cardIcon"])}
                      >
                        {CARD_ICONS.map(icon => (
                          <option key={icon} value={icon}>
                            {formatType(icon)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Overlay</FieldLabel>
                      <select
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm capitalize text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.cardOverlayTone}
                        onChange={event =>
                          updateDraft(
                            "cardOverlayTone",
                            event.target.value as AdminSupportServiceRecord["cardOverlayTone"],
                          )}
                      >
                        {OVERLAY_TONES.map(tone => (
                          <option key={tone} value={tone}>
                            {tone}
                            {" "}
                            overlay
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Card Image URL</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="https://example.com/image.jpg"
                        value={draft.cardImageUrl ?? ""}
                        onChange={event => updateDraft("cardImageUrl", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Card Image Alt Text</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="Person using support service"
                        value={draft.cardImageAlt ?? ""}
                        onChange={event => updateDraft("cardImageAlt", event.target.value)}
                      />
                    </label>
                  </div>
                )
              : null}

            {activeFormStep === 2
              ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <FieldLabel>Availability Status</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.availabilityLabel}
                        onChange={event => updateDraft("availabilityLabel", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Referral Type</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.referralTitle}
                        onChange={event => updateDraft("referralTitle", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Warm Referral Description</FieldLabel>
                      <textarea
                        className="min-h-24 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.referralDescription}
                        onChange={event => updateDraft("referralDescription", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Priority</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        type="number"
                        min={0}
                        max={100}
                        value={draft.priority}
                        onChange={event => updateDraft("priority", Number(event.target.value))}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Resource Links</FieldLabel>
                      <textarea
                        className="min-h-20 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="Legal Aid NSW | https://www.legalaid.nsw.gov.au"
                        value={draft.resourceLinks}
                        onChange={event => updateDraft("resourceLinks", event.target.value)}
                      />
                    </label>
                  </div>
                )
              : null}

            {activeFormStep === 3
              ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <FieldLabel>Jurisdiction</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.jurisdiction}
                        onChange={event => updateDraft("jurisdiction", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Sort Order</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        type="number"
                        value={draft.sortOrder}
                        onChange={event => updateDraft("sortOrder", Number(event.target.value))}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Safety Risk Levels</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="all or low, medium, high"
                        value={draft.safetyRiskLevels}
                        onChange={event => updateDraft("safetyRiskLevels", event.target.value)}
                        list="support-risk-level-options"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Region</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.regions}
                        onChange={event => updateDraft("regions", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5">
                      <FieldLabel>Language</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        value={draft.languages}
                        onChange={event => updateDraft("languages", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Eligibility Tags</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="legal-help, domestic-violence, discrimination"
                        value={draft.eligibility}
                        onChange={event => updateDraft("eligibility", event.target.value)}
                      />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <FieldLabel>Profile Tags</FieldLabel>
                      <input
                        className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                        placeholder="legal, support, rights"
                        value={draft.profiles}
                        onChange={event => updateDraft("profiles", event.target.value)}
                      />
                    </label>
                  </div>
                )
              : null}

            {activeFormStep === 4
              ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1.5 md:col-span-2">
                        <FieldLabel>Safety Notes</FieldLabel>
                        <textarea
                          className="min-h-20 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.safetyNotes ?? ""}
                          onChange={event => updateDraft("safetyNotes", event.target.value)}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <FieldLabel>Eligibility Notes</FieldLabel>
                        <textarea
                          className="min-h-20 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.eligibilityNotes ?? ""}
                          onChange={event => updateDraft("eligibilityNotes", event.target.value)}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <FieldLabel>Language Support Notes</FieldLabel>
                        <textarea
                          className="min-h-20 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.languageSupportNotes ?? ""}
                          onChange={event => updateDraft("languageSupportNotes", event.target.value)}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <FieldLabel>Website URL</FieldLabel>
                        <input
                          className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.websiteUrl}
                          onChange={event => updateDraft("websiteUrl", event.target.value)}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <FieldLabel>Booking URL</FieldLabel>
                        <input
                          className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.bookingUrl}
                          onChange={event => updateDraft("bookingUrl", event.target.value)}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <FieldLabel>Phone</FieldLabel>
                        <input
                          className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.phone}
                          onChange={event => updateDraft("phone", event.target.value)}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <FieldLabel>Email</FieldLabel>
                        <input
                          className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          value={draft.email}
                          onChange={event => updateDraft("email", event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-[#244961] md:grid-cols-4">
                      {([
                        ["crisis", "Crisis service"],
                        ["informationOnly", "Information only"],
                        ["isPublished", "Published"],
                        ["isActive", "Active"],
                      ] as const).map(([field, label]) => (
                        <label
                          key={field}
                          className="flex h-10 items-center gap-2 rounded-[8px] border border-[#D8E5F0] bg-[#FBFDFF] px-3"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(draft[field])}
                            onChange={event => updateDraft(field, event.target.checked)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E4ECF3] bg-[#F8FBFE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={activeFormStep === 0 || isSubmitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#C9DAE8] bg-white px-4 text-sm font-semibold text-[#244961] transition hover:bg-[#F5FAFF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="text-center text-xs font-bold text-[#607B90] sm:text-left">
                Step
                {" "}
                {activeFormStep + 1}
                {" "}
                of
                {" "}
                {SERVICE_FORM_STEPS.length}
              </span>
              {isFinalFormStep
                ? (
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#0A66A8] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(10,102,168,0.18)] transition hover:bg-[#07588F] disabled:opacity-60"
                      disabled={isSubmitting}
                      onClick={() => void handleSave()}
                      type="button"
                    >
                      {isSubmitting
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {isSubmitting ? "Saving..." : editingServiceId ? "Update service" : "Save service"}
                    </button>
                  )
                : (
                    <button
                      type="button"
                      onClick={handleContinue}
                      disabled={isSubmitting}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#0A66A8] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(10,102,168,0.18)] transition hover:bg-[#07588F] disabled:opacity-60"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <section className="space-y-6">
        <div className="hidden">
          <div className="border-b border-[#E4ECF3] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A66A8]">
                  Add/Edit Service Form
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#0B1F33]">
                  {editingServiceId ? "Edit support service" : "Add new service"}
                </h2>
              </div>
              {editingServiceId
                ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingServiceId(null);
                        setDraft(emptyDraft);
                      }}
                      className="inline-flex h-9 items-center justify-center rounded-[8px] border border-[#C9DAE8] px-3 text-xs font-semibold text-[#244961] transition hover:bg-[#F5FAFF]"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Clear edit
                    </button>
                  )
                : null}
            </div>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <FieldLabel>Key</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="nsw-legal-aid"
                  value={draft.key}
                  onChange={event => updateDraft("key", event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Service Name</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="Legal Aid NSW"
                  value={draft.name}
                  onChange={event => updateDraft("name", event.target.value)}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Category</FieldLabel>
                <select
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm capitalize text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.type}
                  onChange={event =>
                    updateDraft("type", event.target.value as AdminSupportServiceRecord["type"])}
                >
                  {SUPPORT_TYPES.map(type => (
                    <option key={type} value={type}>
                      {formatType(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Short Description</FieldLabel>
                <textarea
                  className="min-h-24 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="Short user-facing description"
                  value={draft.description}
                  onChange={event => updateDraft("description", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <FieldLabel>Shield Icon</FieldLabel>
                <select
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm capitalize text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.cardIcon}
                  onChange={event =>
                    updateDraft("cardIcon", event.target.value as AdminSupportServiceRecord["cardIcon"])}
                >
                  {CARD_ICONS.map(icon => (
                    <option key={icon} value={icon}>
                      {formatType(icon)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Overlay</FieldLabel>
                <select
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm capitalize text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.cardOverlayTone}
                  onChange={event =>
                    updateDraft(
                      "cardOverlayTone",
                      event.target.value as AdminSupportServiceRecord["cardOverlayTone"],
                    )}
                >
                  {OVERLAY_TONES.map(tone => (
                    <option key={tone} value={tone}>
                      {tone}
                      {" "}
                      overlay
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Card Image URL</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="https://example.com/image.jpg"
                  value={draft.cardImageUrl ?? ""}
                  onChange={event => updateDraft("cardImageUrl", event.target.value)}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Card Image Alt Text</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="Person using support service"
                  value={draft.cardImageAlt ?? ""}
                  onChange={event => updateDraft("cardImageAlt", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <FieldLabel>Availability Status</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.availabilityLabel}
                  onChange={event => updateDraft("availabilityLabel", event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Referral Type</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.referralTitle}
                  onChange={event => updateDraft("referralTitle", event.target.value)}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Warm Referral Description</FieldLabel>
                <textarea
                  className="min-h-24 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.referralDescription}
                  onChange={event => updateDraft("referralDescription", event.target.value)}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Resource Links</FieldLabel>
                <textarea
                  className="min-h-20 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 py-2 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="Legal Aid NSW | https://www.legalaid.nsw.gov.au"
                  value={draft.resourceLinks}
                  onChange={event => updateDraft("resourceLinks", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <FieldLabel>Jurisdiction</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.jurisdiction}
                  onChange={event => updateDraft("jurisdiction", event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Sort Order</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  type="number"
                  value={draft.sortOrder}
                  onChange={event => updateDraft("sortOrder", Number(event.target.value))}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Region</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.regions}
                  onChange={event => updateDraft("regions", event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Language</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.languages}
                  onChange={event => updateDraft("languages", event.target.value)}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Eligibility Tags</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="legal-help, domestic-violence, discrimination"
                  value={draft.eligibility}
                  onChange={event => updateDraft("eligibility", event.target.value)}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <FieldLabel>Profile Tags</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  placeholder="legal, support, rights"
                  value={draft.profiles}
                  onChange={event => updateDraft("profiles", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <FieldLabel>Website URL</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.websiteUrl}
                  onChange={event => updateDraft("websiteUrl", event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Booking URL</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.bookingUrl}
                  onChange={event => updateDraft("bookingUrl", event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Phone</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.phone}
                  onChange={event => updateDraft("phone", event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <FieldLabel>Email</FieldLabel>
                <input
                  className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                  value={draft.email}
                  onChange={event => updateDraft("email", event.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-[#244961] md:grid-cols-4">
              {(["crisis", "informationOnly", "isPublished"] as const).map(field => (
                <label
                  key={field}
                  className="flex h-10 items-center gap-2 rounded-[8px] border border-[#D8E5F0] bg-[#FBFDFF] px-3"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(draft[field])}
                    onChange={event => updateDraft(field, event.target.checked)}
                  />
                  {field}
                </label>
              ))}
              <label className="flex h-10 items-center gap-2 rounded-[8px] border border-[#D8E5F0] bg-[#FBFDFF] px-3">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={event => updateDraft("isActive", event.target.checked)}
                />
                isActive
              </label>
            </div>

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[#0A66A8] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(10,102,168,0.18)] transition hover:bg-[#07588F] disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSubmitting
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Saving..." : editingServiceId ? "Update service" : "Save service"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {editingServiceId
            ? (
                <section className="rounded-[12px] border border-[#D8E5F0] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-3 px-5 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-bold text-[#0B1F33]">Directory Preview</h2>
                      <StatusBadge active={draft.isPublished} activeLabel="Published" inactiveLabel="Draft" />
                      <StatusBadge active={draft.isActive} activeLabel="Active" inactiveLabel="Inactive" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedService) {
                            handleEdit(selectedService);
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#C9DAE8] px-3 text-xs font-bold text-[#244961] transition hover:bg-[#F5FAFF]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingServiceId(null);
                          setDraft(prev => ({
                            ...prev,
                            key: prev.key ? `${prev.key}-copy` : "",
                            name: prev.name ? `${prev.name} Copy` : "",
                            isPublished: false,
                          }));
                          setActiveFormStep(0);
                          setIsServiceModalOpen(true);
                        }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#C9DAE8] px-3 text-xs font-bold text-[#244961] transition hover:bg-[#F5FAFF]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedService) {
                            void handleToggle(selectedService, "isPublished");
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#C9DAE8] px-3 text-xs font-bold text-[#244961] transition hover:bg-[#F5FAFF]"
                      >
                        {selectedService?.isPublished
                          ? <EyeOff className="h-3.5 w-3.5" />
                          : <Eye className="h-3.5 w-3.5" />}
                        {selectedService?.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedService) {
                            void handleToggle(selectedService, "isActive");
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#C9DAE8] px-3 text-xs font-bold text-[#244961] transition hover:bg-[#F5FAFF]"
                      >
                        {selectedService?.isActive
                          ? <PowerOff className="h-3.5 w-3.5" />
                          : <Power className="h-3.5 w-3.5" />}
                        {selectedService?.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedService) {
                            void handleDelete(selectedService);
                          }
                        }}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#F3C9C9] px-3 text-xs font-bold text-[#B42318] transition hover:bg-[#FFF5F5]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseServiceView}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[6px] border border-[#C9DAE8] px-3 text-xs font-bold text-[#244961] transition hover:bg-[#F5FAFF]"
                      >
                        <X className="h-3.5 w-3.5" />
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="px-5 pb-5 sm:px-6">
                    <article className="overflow-hidden rounded-[8px] border border-[#DFE8F2] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] lg:grid lg:grid-cols-[minmax(260px,0.78fr)_1fr]">
                      <div className="relative min-h-[220px] bg-[linear-gradient(135deg,#0A66A8_0%,#1D72D8_100%)] lg:min-h-[260px]">
                        {draft.cardImageUrl
                          ? (
                              <img
                                src={draft.cardImageUrl}
                                alt={draft.cardImageAlt || draft.name || "Service preview"}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            )
                          : null}
                        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0)_70%)]" />
                        <span className="absolute left-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#07569A] text-white shadow-[0_8px_18px_rgba(7,86,154,0.28)]">
                          <Shield className="h-6 w-6" />
                        </span>
                      </div>
                      <div className="flex min-h-[260px] flex-col justify-center p-5 sm:p-7">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DFF4E8] px-2.5 py-1 text-[11px] font-bold text-[#0F7A43]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#13A463]" />
                            {draft.availabilityLabel || "Available Now"}
                          </span>
                        </div>
                        <h3 className="mt-3 text-[26px] font-black leading-tight text-[#0B1F33]">
                          {draft.name || "Service name"}
                        </h3>
                        <span className="mt-2 inline-flex w-fit rounded-full bg-[#F0E8FF] px-2.5 py-1 text-[11px] font-bold text-[#6D28D9]">
                          {draft.referralTitle || "Warm Referral"}
                        </span>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-[#526B80]">
                          {draft.description || "Short service description will appear here."}
                        </p>
                        <div className="mt-5 grid gap-2 text-sm font-semibold text-[#0A66A8]">
                          {draft.websiteUrl
                            ? (
                                <span className="inline-flex items-center gap-2">
                                  <Globe2 className="h-4 w-4" />
                                  {draft.websiteUrl}
                                </span>
                              )
                            : null}
                          {draft.phone
                            ? (
                                <span className="inline-flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {draft.phone}
                                </span>
                              )
                            : null}
                          {draft.email
                            ? (
                                <span className="inline-flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {draft.email}
                                </span>
                              )
                            : null}
                        </div>
                        <div className="mt-7 flex flex-wrap gap-2">
                          {previewEligibility.slice(0, 3).map(tag => (
                            <span key={tag} className="rounded-full bg-[#EEF3F8] px-3 py-1 text-[11px] font-semibold text-[#526B80]">
                              {tag}
                            </span>
                          ))}
                          {previewEligibility.length > 3
                            ? (
                                <span className="rounded-full bg-[#EEF3F8] px-3 py-1 text-[11px] font-semibold text-[#526B80]">
                                  +
                                  {previewEligibility.length - 3}
                                </span>
                              )
                            : null}
                        </div>
                      </div>
                    </article>
                  </div>

                  <div className="border-t border-[#E4ECF3] px-5 sm:px-6">
                    <div className="flex gap-8 overflow-x-auto">
                      {SERVICE_PREVIEW_TAB_CONFIG.map(({ icon: Icon, label, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setActivePreviewTab(value)}
                          className={cn(
                            "relative inline-flex h-12 items-center gap-1.5 whitespace-nowrap text-xs font-bold transition",
                            activePreviewTab === value ? "text-[#0A66A8]" : "text-[#7A8CA0] hover:text-[#244961]",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                          {activePreviewTab === value
                            ? (
                                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#0A66A8]" />
                              )
                            : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activePreviewTab === "overview"
                    ? (
                        <>
                          <DetailGrid
                          items={[
                              ["Key", draft.key || "Not set"],
                              ["Category", formatType(draft.type)],
                              ["Resource Type", formatType(draft.resourceType)],
                              ["Jurisdiction", draft.jurisdiction || "Not set"],
                              ["Region", previewRegions.join(", ") || "Not set"],
                              ["Language", previewLanguages.join(", ") || "Not set"],
                              ["Issue Types", previewIssueTypes.join(", ") || "Not set"],
                              ["Risk Levels", previewSafetyRiskLevels.join(", ") || "Not set"],
                              ["CTA Label", draft.ctaLabel || "Not set"],
                              ["Priority", String(draft.priority || 0)],
                              ["Sort Order", String(draft.sortOrder || 0)],
                              ["Referral Type", draft.referralTitle || "Not set"],
                              ["Availability", draft.availabilityLabel || "Not set"],
                              ["Created By", "Admin User"],
                              ["Created At", formatDateTime(selectedService?.createdAt)],
                              ["Last Updated", formatDateTime(selectedService?.updatedAt)],
                              ["Resource Links", previewLinks.length ? `${previewLinks.length} configured` : "None"],
                            ]}
                          />

                          {previewProfiles.length || previewLinks.length
                            ? (
                                <div className="border-t border-[#E4ECF3] px-5 py-4 sm:px-6">
                                  <TagList items={[...previewProfiles, ...previewLinks.map(link => link.label)]} />
                                </div>
                              )
                            : null}
                        </>
                      )
                    : null}

                  {activePreviewTab === "details"
                    ? (
                        <DetailGrid
                          items={[
                            ["Description", draft.description || "Not set"],
                            ["Referral Copy", draft.referralDescription || "Not set"],
                            ["Card Icon", formatType(draft.cardIcon)],
                            ["Overlay", `${formatType(draft.cardOverlayTone)} overlay`],
                            ["Image URL", draft.cardImageUrl || "Not set"],
                            ["Image Alt", draft.cardImageAlt || "Not set"],
                            ["Safety Notes", draft.safetyNotes || "Not set"],
                            ["Eligibility Notes", draft.eligibilityNotes || "Not set"],
                            ["Language Notes", draft.languageSupportNotes || "Not set"],
                            ["Crisis Service", formatDisplayValue(draft.crisis)],
                            ["Information Only", formatDisplayValue(draft.informationOnly)],
                            ["Published", formatDisplayValue(draft.isPublished)],
                            ["Active", formatDisplayValue(draft.isActive)],
                          ]}
                        />
                      )
                    : null}

                  {activePreviewTab === "tags & filters"
                    ? (
                        <div className="grid gap-5 px-5 py-6 sm:px-6 lg:grid-cols-2">
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Issue Types</h3>
                            <div className="mt-3">
                              <TagList items={previewIssueTypes} />
                            </div>
                          </div>
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Safety Risk Levels</h3>
                            <div className="mt-3">
                              <TagList items={previewSafetyRiskLevels} />
                            </div>
                          </div>
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Regions</h3>
                            <div className="mt-3">
                              <TagList items={previewRegions} />
                            </div>
                          </div>
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Languages</h3>
                            <div className="mt-3">
                              <TagList items={previewLanguages} />
                            </div>
                          </div>
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Eligibility Tags</h3>
                            <div className="mt-3">
                              <TagList items={previewEligibility} />
                            </div>
                          </div>
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Profile Tags</h3>
                            <div className="mt-3">
                              <TagList items={previewProfiles} />
                            </div>
                          </div>
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4 lg:col-span-2">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Metadata</h3>
                            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                              {serviceMetadataEntries.length
                                ? serviceMetadataEntries.map(([key, value]) => (
                                    <div key={key} className="grid grid-cols-[140px_1fr] gap-3">
                                      <span className="text-xs font-bold text-[#6B8196]">{key}</span>
                                      <span className="font-semibold text-[#244961]">{formatDisplayValue(value)}</span>
                                    </div>
                                  ))
                                : (
                                    <span className="font-semibold text-[#607B90]">None</span>
                                  )}
                            </div>
                          </div>
                        </div>
                      )
                    : null}

                  {activePreviewTab === "links"
                    ? (
                        <div className="grid gap-5 px-5 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Primary Contacts</h3>
                            <div className="mt-4 grid gap-3 text-sm">
                              <span className="font-semibold text-[#244961]">
                                Website:
                                {" "}
                                {draft.websiteUrl || "Not set"}
                              </span>
                              <span className="font-semibold text-[#244961]">
                                Booking:
                                {" "}
                                {draft.bookingUrl || "Not set"}
                              </span>
                              <span className="font-semibold text-[#244961]">
                                Phone:
                                {" "}
                                {draft.phone || "Not set"}
                              </span>
                              <span className="font-semibold text-[#244961]">
                                Email:
                                {" "}
                                {draft.email || "Not set"}
                              </span>
                              <span className="font-semibold text-[#244961]">
                                Address:
                                {" "}
                                {draft.address || "Not set"}
                              </span>
                            </div>
                          </div>
                          <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4">
                            <h3 className="text-sm font-bold text-[#0B1F33]">Resource Links</h3>
                            <div className="mt-4 grid gap-3">
                              {previewLinks.length
                                ? previewLinks.map(link => (
                                    <a
                                      key={`${link.label}-${link.url}`}
                                      href={link.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-[8px] border border-[#D8E5F0] bg-white px-3 py-2 text-sm font-semibold text-[#0A66A8] transition hover:bg-[#F5FAFF]"
                                    >
                                      {link.label}
                                      <span className="mt-1 block text-xs font-medium text-[#607B90]">{link.url}</span>
                                    </a>
                                  ))
                                : (
                                    <span className="text-sm font-semibold text-[#607B90]">No resource links configured.</span>
                                  )}
                            </div>
                          </div>
                        </div>
                      )
                    : null}

                  {activePreviewTab === "activity log"
                    ? (
                        <div className="px-5 py-6 sm:px-6">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-[#0B1F33]">Service Activity</h3>
                              <p className="mt-1 text-xs text-[#607B90]">
                                Warm referral requests linked to this support service.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void refreshSelectedServiceActivity()}
                              disabled={isLoadingServiceActivity}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[7px] border border-[#C9DAE8] px-3 text-xs font-bold text-[#244961] transition hover:bg-[#F5FAFF] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RefreshCw className={cn("h-3.5 w-3.5", isLoadingServiceActivity ? "animate-spin" : "")} />
                              Refresh
                            </button>
                          </div>
                          {isLoadingServiceActivity
                            ? (
                                <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] px-4 py-5 text-center text-sm font-semibold text-[#607B90]">
                                  Loading service activity...
                                </div>
                              )
                            : null}
                          {serviceActivityMessage
                            ? (
                                <div className="rounded-[10px] border border-[#F3C9C9] bg-[#FFF7F7] px-4 py-3 text-sm font-semibold text-[#B42318]">
                                  {serviceActivityMessage}
                                </div>
                              )
                            : null}
                          {!isLoadingServiceActivity && !serviceActivityMessage && selectedServiceReferrals.length === 0
                            ? (
                                <div className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] px-4 py-5 text-center text-sm font-semibold text-[#607B90]">
                                  No warm referral activity has been recorded for this service.
                                </div>
                              )
                            : null}
                          <div className="grid gap-3">
                            {selectedServiceReferrals.map(referral => (
                              <ReferralActivityCard
                                key={referral._id}
                                className="rounded-[10px] border border-[#E4ECF3] bg-[#FBFDFF] p-4"
                                isUpdating={updatingReferralAction?.id === referral._id}
                                onStatusChange={(activityReferral, status) => {
                                  void handleReferralStatus(activityReferral, status);
                                }}
                                pendingStatus={updatingReferralAction?.id === referral._id
                                  ? updatingReferralAction.status
                                  : undefined}
                                referral={referral}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    : null}
                </section>
              )
            : null}

          <section className="rounded-[12px] border border-[#D8E5F0] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 border-b border-[#E4ECF3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#0B1F33]">
                  {activeDirectoryTab === "services" ? "All Support Services" : "Activity Log"}
                </h2>
                <p className="mt-1 text-xs text-[#607B90]">
                  {activeDirectoryTab === "services"
                    ? "Manage all services in the directory."
                    : "Monitor consented referral requests without exposing full safe-contact details."}
                </p>
              </div>
              <div className="inline-flex rounded-[10px] border border-[#D6E3F0] bg-[#F8FBFE] p-1">
                <button
                  type="button"
                  onClick={() => setActiveDirectoryTab("services")}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] px-4 text-xs font-bold transition",
                    activeDirectoryTab === "services"
                      ? "bg-white text-[#0A66A8] shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                      : "text-[#607B90] hover:text-[#0B1F33]",
                  )}
                >
                  <Layers3 className="h-3.5 w-3.5" />
                  All Support Services
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDirectoryTab("activity");
                    void refreshOverallActivity();
                  }}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] px-4 text-xs font-bold transition",
                    activeDirectoryTab === "activity"
                      ? "bg-white text-[#0A66A8] shadow-[0_3px_10px_rgba(15,23,42,0.08)]"
                      : "text-[#607B90] hover:text-[#0B1F33]",
                  )}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Activity Log
                </button>
              </div>
            </div>

            {activeDirectoryTab === "services"
              ? (
                  <>
                    <div className="flex flex-col gap-3 border-b border-[#E4ECF3] px-5 py-4 lg:flex-row lg:items-center sm:px-6">
                      <label className="relative w-full lg:max-w-[360px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8AA0B5]" />
                        <input
                          className="h-10 w-full rounded-[8px] border border-[#C9DAE8] bg-white pl-9 pr-3 text-sm text-[#0B1F33] outline-none transition focus:border-[#0A66A8]"
                          placeholder="Search services..."
                          value={filter}
                          onChange={event => setFilter(event.target.value)}
                        />
                      </label>
                      <select
                        className="h-10 rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#244961]"
                        value={resourceTypeFilter}
                        onChange={event =>
                          setResourceTypeFilter(event.target.value as typeof resourceTypeFilter)}
                      >
                        <option value="all">All resource types</option>
                        {RESOURCE_TYPES.map(type => (
                          <option key={type} value={type}>{formatType(type)}</option>
                        ))}
                      </select>
                      <select
                        className="h-10 rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#244961]"
                        value={issueTypeFilter}
                        onChange={event =>
                          setIssueTypeFilter(event.target.value as typeof issueTypeFilter)}
                      >
                        <option value="all">All issue types</option>
                        {ISSUE_TYPES.map(type => (
                          <option key={type} value={type}>{formatType(type)}</option>
                        ))}
                      </select>
                      <select
                        className="h-10 rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#244961]"
                        value={jurisdictionFilter}
                        onChange={event => setJurisdictionFilter(event.target.value)}
                      >
                        <option value="all">All jurisdictions</option>
                        {Array.from(new Set(services.map(service => service.jurisdiction).filter(Boolean))).map(value => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                      <select
                        className="h-10 rounded-[8px] border border-[#C9DAE8] bg-white px-3 text-sm text-[#244961]"
                        value={statusFilter}
                        onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
                      >
                        <option value="all">All status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <div className="flex flex-1 justify-end">
                        <span className="rounded-full bg-[#EEF6FF] px-3 py-1 text-xs font-bold text-[#0A66A8]">
                          Showing
                          {" "}
                          {filteredServices.length}
                          {" "}
                          of
                          {" "}
                          {services.length}
                          {" "}
                          results
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[980px] border-collapse text-left">
                        <thead className="bg-[#F8FBFE] text-[11px] font-bold uppercase tracking-[0.08em] text-[#607B90]">
                          <tr>
                            <th className="px-5 py-3 sm:px-6">Service Name</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Resource Type</th>
                            <th className="px-4 py-3">Region</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Priority</th>
                            <th className="px-4 py-3">Updated At</th>
                            <th className="px-5 py-3 text-right sm:px-6">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4ECF3]">
                          {isLoading
                            ? (
                                <tr>
                                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-[#526B80]">
                                    Loading services...
                                  </td>
                                </tr>
                              )
                            : null}
                          {!isLoading && filteredServices.length === 0
                            ? (
                                <tr>
                                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-[#526B80]">
                                    No support services matched this view.
                                  </td>
                                </tr>
                              )
                            : null}
                          {filteredServices.map(service => (
                            <tr key={service._id} className="align-middle transition hover:bg-[#FBFDFF]">
                              <td className="px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#EEF6FF] text-[#0A66A8]">
                                    {service.cardImageUrl
                                      ? (
                                          <img src={service.cardImageUrl} alt={service.cardImageAlt ?? service.name} className="h-full w-full object-cover" />
                                        )
                                      : (
                                          <Shield className="h-4 w-4" />
                                        )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#0B1F33]">{service.name}</p>
                                    <p className="mt-0.5 text-xs text-[#607B90]">{service.key}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm capitalize text-[#244961]">{formatType(service.type)}</td>
                              <td className="px-4 py-4 text-sm capitalize text-[#244961]">{formatType(service.resourceType)}</td>
                              <td className="px-4 py-4 text-sm text-[#244961]">{service.regions.join(", ") || service.jurisdiction}</td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col gap-1">
                                  <StatusBadge active={service.isPublished} activeLabel="Published" inactiveLabel="Draft" />
                                  <StatusBadge active={service.isActive} activeLabel="Active" inactiveLabel="Inactive" />
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-[#244961]">{service.priority}</td>
                              <td className="px-4 py-4 text-sm text-[#607B90]">
                                {service.updatedAt ? new Date(service.updatedAt).toLocaleDateString() : "Recently"}
                              </td>
                              <td className="px-5 py-4 text-right sm:px-6">
                                <div className="inline-flex flex-wrap justify-end gap-2">
                                  <button
                                    aria-label={`View ${service.name}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#C9DAE8] text-[#244961] transition hover:bg-[#F5FAFF]"
                                    onClick={() => handleView(service)}
                                    title="View"
                                    type="button"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    aria-label={`Edit ${service.name}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#C9DAE8] text-[#244961] transition hover:bg-[#F5FAFF]"
                                    onClick={() => handleEdit(service)}
                                    title="Edit"
                                    type="button"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    aria-label={`Delete ${service.name}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] border border-[#F3C9C9] text-[#B42318] transition hover:bg-[#FFF5F5]"
                                    onClick={() => void handleDelete(service)}
                                    title="Delete"
                                    type="button"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              : (
                  <div>
                    <div className="flex flex-col gap-3 border-b border-[#E4ECF3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        {REFERRAL_STATUS_FILTERS.map(({ icon: Icon, label, value }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setActivityStatusFilter(value);
                              void refreshOverallActivity(value);
                            }}
                            className={cn(
                              "inline-flex h-9 items-center justify-center gap-1.5 rounded-[7px] border px-3 text-xs font-bold transition",
                              activityStatusFilter === value
                                ? "border-[#0A66A8] bg-[#EEF6FF] text-[#0A66A8]"
                                : "border-[#C9DAE8] text-[#607B90] hover:bg-[#F5FAFF] hover:text-[#244961]",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => void refreshOverallActivity()}
                        disabled={isLoadingReferrals}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[7px] border border-[#C9DAE8] px-3 text-xs font-bold text-[#244961] transition hover:bg-[#F5FAFF] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isLoadingReferrals ? "animate-spin" : "")} />
                        Refresh
                      </button>
                    </div>
                    {activityMessage
                      ? (
                          <div className="border-b border-[#E4ECF3] bg-[#FFF7F7] px-5 py-3 text-sm font-semibold text-[#B42318] sm:px-6">
                            {activityMessage}
                          </div>
                        )
                      : null}
                    <div className="divide-y divide-[#E4ECF3]">
                      {isLoadingReferrals
                        ? (
                            <div className="px-5 py-8 text-center text-sm font-semibold text-[#607B90]">
                              Loading referral activity...
                            </div>
                          )
                        : null}
                      {!isLoadingReferrals && referrals.length === 0
                        ? (
                          <div className="px-5 py-8 text-center text-sm text-[#526B80]">
                            No warm referrals have been requested yet.
                          </div>
                        )
                      : null}
                      {!isLoadingReferrals && referrals.map(referral => (
                        <ReferralActivityCard
                          key={referral._id}
                          className="px-5 py-4 sm:px-6"
                          isUpdating={updatingReferralAction?.id === referral._id}
                          onStatusChange={(activityReferral, status) => {
                            void handleReferralStatus(activityReferral, status);
                          }}
                          pendingStatus={updatingReferralAction?.id === referral._id
                            ? updatingReferralAction.status
                            : undefined}
                          referral={referral}
                        />
                      ))}
                    </div>
                  </div>
                )}
          </section>
        </div>
        <datalist id="support-issue-type-options">
          {ISSUE_TYPES.map(value => (
            <option key={value} value={value} />
          ))}
        </datalist>
        <datalist id="support-risk-level-options">
          {SAFETY_RISK_LEVELS.map(value => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </section>
    </div>
  );
}
