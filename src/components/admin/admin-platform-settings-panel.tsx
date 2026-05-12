import {
  getAdminPlatformSettings,
  publishPlatformSettingsDraft,
  updatePlatformSettingsDraft,
  type PlatformSettingsPayload,
} from "@/lib/platform-settings";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type FieldConfig = {
  section: keyof PlatformSettingsPayload;
  key: string;
  label: string;
  rows?: number;
};

const SAFETY_FIELDS: FieldConfig[] = [
  {
    section: "safety",
    key: "immediateDangerText",
    label: "Immediate danger prompt",
    rows: 2,
  },
  {
    section: "safety",
    key: "respectSupportText",
    label: "1800RESPECT prompt",
    rows: 2,
  },
  {
    section: "safety",
    key: "platformRoleText",
    label: "Platform role statement",
    rows: 3,
  },
  {
    section: "safety",
    key: "informationOnlyText",
    label: "Information-only statement",
    rows: 2,
  },
  {
    section: "safety",
    key: "emergencyCallLabel",
    label: "Emergency call label",
  },
  {
    section: "safety",
    key: "respectCallLabel",
    label: "1800RESPECT call label",
  },
  { section: "safety", key: "quickExitLabel", label: "Quick Exit label" },
  { section: "safety", key: "covertModeLabel", label: "Covert Mode label" },
];

const CONSENT_FIELDS: FieldConfig[] = [
  {
    section: "consent",
    key: "introText",
    label: "Consent introduction",
    rows: 3,
  },
  {
    section: "consent",
    key: "localStorageLabel",
    label: "Local storage label",
  },
  { section: "consent", key: "cloudSyncLabel", label: "Cloud sync label" },
  {
    section: "consent",
    key: "agencySharingLabel",
    label: "Agency sharing label",
  },
  { section: "consent", key: "analyticsLabel", label: "Analytics label" },
];

const AI_FIELDS: FieldConfig[] = [
  { section: "ai", key: "disclaimerText", label: "AI disclaimer", rows: 3 },
  {
    section: "ai",
    key: "humanReviewText",
    label: "Human review reminder",
    rows: 2,
  },
];

const FIELD_GROUPS = [
  { title: "Safety Copy", fields: SAFETY_FIELDS },
  { title: "Consent Copy", fields: CONSENT_FIELDS },
  { title: "AI Copy", fields: AI_FIELDS },
] as const;

function formatDate(value?: string) {
  if (!value) {
    return "Not published yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFieldValue(settings: PlatformSettingsPayload, field: FieldConfig) {
  return settings[field.section][field.key as never] as string;
}

function setFieldValue(
  settings: PlatformSettingsPayload,
  field: FieldConfig,
  value: string,
): PlatformSettingsPayload {
  return {
    ...settings,
    [field.section]: {
      ...settings[field.section],
      [field.key]: value,
    },
  };
}

export function AdminPlatformSettingsPanel() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PlatformSettingsPayload | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | undefined>();
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const settings = await getAdminPlatformSettings();

      setDraft(settings.draft);
      setVersion(settings.version);
      setPublishedAt(settings.publishedAt);
      setUpdatedAt(settings.updatedAt);
      setStatusMessage(null);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not load platform settings.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSaveDraft = async () => {
    if (!draft) {
      return;
    }

    setIsSaving(true);

    try {
      const settings = await updatePlatformSettingsDraft(draft);

      setDraft(settings.draft);
      setVersion(settings.version);
      setPublishedAt(settings.publishedAt);
      setUpdatedAt(settings.updatedAt);
      setStatusMessage("Draft settings saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not save draft settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const settings = await publishPlatformSettingsDraft();

      setDraft(settings.draft);
      setVersion(settings.version);
      setPublishedAt(settings.publishedAt);
      setUpdatedAt(settings.updatedAt);
      setStatusMessage("Platform settings published.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not publish platform settings.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3 rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <button
          type="button"
          onClick={() => navigate(APP_ROUTE_PATHS.adminSettings)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/95 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Back to settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="admin-panel-title font-semibold leading-none text-white">
          Platform Settings
        </h2>
      </div>

      <div className="admin-panel-min-h px-4 pb-8 pt-5 sm:px-6">
        <div className="flex flex-col gap-3 border-b border-[#D8E3EE] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#607B90]">
              Published version
            </p>
            <p className="mt-1 text-[22px] font-semibold text-[#0F172A]">
              {version === null ? "Loading..." : `Version ${version}`}
            </p>
            <p className="mt-1 text-[12px] text-[#607B90]">
              Published: {formatDate(publishedAt)}
              {" | "}
              Updated: {formatDate(updatedAt)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleSaveDraft()}
              disabled={!draft || isLoading || isSaving}
              className="h-9 rounded-md bg-[#0F67AE] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={!draft || isLoading || isPublishing}
              className="h-9 rounded-md bg-[#F59E0B] px-4 text-[13px] font-semibold text-white transition hover:bg-[#D88B07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>

        {statusMessage ? (
          <p className="mt-4 rounded-md bg-[#EEF6FF] px-3 py-2 text-[13px] font-medium text-[#0F67AE]">
            {statusMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="mt-6 text-[13px] text-[#607B90]">
            Loading platform settings...
          </p>
        ) : null}

        {draft ? (
          <div className="mt-5 space-y-6">
            {FIELD_GROUPS.map((group) => (
              <section key={group.title} className="space-y-3">
                <h3 className="text-[20px] font-semibold text-[#1E3A4F]">
                  {group.title}
                </h3>
                <div className="grid gap-3 xl:grid-cols-2">
                  {group.fields.map((field) => (
                    <label
                      key={`${field.section}.${field.key}`}
                      className={
                        field.rows ? "space-y-1 xl:col-span-2" : "space-y-1"
                      }
                    >
                      <span className="text-[13px] font-semibold text-[#334155]">
                        {field.label}
                      </span>
                      {field.rows ? (
                        <textarea
                          value={getFieldValue(draft, field)}
                          onChange={(event) =>
                            setDraft((current) =>
                              current
                                ? setFieldValue(
                                    current,
                                    field,
                                    event.target.value,
                                  )
                                : current,
                            )
                          }
                          rows={field.rows}
                          className="w-full resize-y rounded-md border border-[#AEBCC9] bg-white px-3 py-2 text-[14px] leading-5 text-[#1E293B] outline-none transition focus:border-[#0F67AE] focus:ring-2 focus:ring-[#BFE0F7]"
                        />
                      ) : (
                        <input
                          type="text"
                          value={getFieldValue(draft, field)}
                          onChange={(event) =>
                            setDraft((current) =>
                              current
                                ? setFieldValue(
                                    current,
                                    field,
                                    event.target.value,
                                  )
                                : current,
                            )
                          }
                          className="h-10 w-full rounded-md border border-[#AEBCC9] bg-white px-3 text-[14px] text-[#1E293B] outline-none transition focus:border-[#0F67AE] focus:ring-2 focus:ring-[#BFE0F7]"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
