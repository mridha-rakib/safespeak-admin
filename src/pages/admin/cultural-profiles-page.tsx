import { ADMIN_OPERATIONS_CONFIGS } from "@/components/admin/admin-operations-config";
import {
  AdminOperationsSectionPage,
  type AdminOperationsSectionConfig,
} from "@/components/admin/admin-operations-section-page";
import {
  createAdminCulturalProfile,
  deleteAdminCulturalProfile,
  getCulturalProfilesOverview,
  listAdminCulturalProfiles,
  patchAdminCulturalProfile,
  type AdminCulturalProfilePayload,
  type AdminCulturalProfileRecord,
  type AdminCulturalProfileStatus,
  type AdminCulturalProfileType,
} from "@/lib/cultural-profiles";
import { useEffect, useMemo, useState } from "react";

type CulturalProfileDraft = {
  key: string;
  name: string;
  communityType: AdminCulturalProfileType;
  languages: string;
  faithPathway: string;
  responseGuidance: string;
  referralPreferences: string;
  contentGuidance: string;
  validationStatus: AdminCulturalProfileStatus;
  reviewCadence: string;
  partnerReviewRequired: boolean;
  isActive: boolean;
};

const defaultDraft: CulturalProfileDraft = {
  key: "",
  name: "",
  communityType: "cultural",
  languages: "en",
  faithPathway: "",
  responseGuidance: "",
  referralPreferences: "",
  contentGuidance: "",
  validationStatus: "draft",
  reviewCadence: "Quarterly partner review",
  partnerReviewRequired: true,
  isActive: true,
};

function splitList(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function joinList(value?: string[]): string {
  return value?.join(", ") ?? "";
}

function toPayload(draft: CulturalProfileDraft): AdminCulturalProfilePayload {
  return {
    key: draft.key.trim(),
    name: draft.name.trim(),
    communityType: draft.communityType,
    languages: splitList(draft.languages),
    faithPathway: draft.faithPathway.trim() || undefined,
    responseGuidance: draft.responseGuidance.trim(),
    referralPreferences: splitList(draft.referralPreferences),
    contentGuidance: splitList(draft.contentGuidance),
    validationStatus: draft.validationStatus,
    reviewCadence: draft.reviewCadence.trim(),
    partnerReviewRequired: draft.partnerReviewRequired,
    isActive: draft.isActive,
    metadata: {},
  };
}

function toDraft(profile: AdminCulturalProfileRecord): CulturalProfileDraft {
  return {
    key: profile.key,
    name: profile.name,
    communityType: profile.communityType,
    languages: joinList(profile.languages),
    faithPathway: profile.faithPathway ?? "",
    responseGuidance: profile.responseGuidance,
    referralPreferences: joinList(profile.referralPreferences),
    contentGuidance: joinList(profile.contentGuidance),
    validationStatus: profile.validationStatus,
    reviewCadence: profile.reviewCadence,
    partnerReviewRequired: profile.partnerReviewRequired,
    isActive: profile.isActive,
  };
}

function statusClass(status: AdminCulturalProfileStatus) {
  if (status === "validated") {
    return "bg-[#E8F7EE] text-[#0F7A43]";
  }

  if (status === "pending_review" || status === "needs_update") {
    return "bg-[#FFF4E5] text-[#9A3412]";
  }

  return "bg-[#F1F5F9] text-[#334155]";
}

export function AdminCulturalProfilesPage() {
  const [config, setConfig] = useState<AdminOperationsSectionConfig>(
    ADMIN_OPERATIONS_CONFIGS.culturalProfiles,
  );
  const [profiles, setProfiles] = useState<AdminCulturalProfileRecord[]>([]);
  const [draft, setDraft] = useState<CulturalProfileDraft>(defaultDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AdminCulturalProfileType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = async () => {
    const [nextConfig, nextProfiles] = await Promise.all([
      getCulturalProfilesOverview(),
      listAdminCulturalProfiles({ limit: 100 }),
    ]);

    setConfig(nextConfig);
    setProfiles(nextProfiles);
  };

  useEffect(() => {
    let isMounted = true;

    void refreshAll()
      .then(() => {
        if (isMounted) {
          setError(null);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load cultural profiles.");
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

  const visibleProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesType = typeFilter === "all" || profile.communityType === typeFilter;
      const matchesQuery = !query
        || [
          profile.key,
          profile.name,
          profile.communityType,
          profile.validationStatus,
          profile.responseGuidance,
        ].join(" ").toLowerCase().includes(query);

      return matchesType && matchesQuery;
    });
  }, [profiles, search, typeFilter]);

  const saveProfile = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = toPayload(draft);
      const profile = editingId
        ? await patchAdminCulturalProfile(editingId, payload)
        : await createAdminCulturalProfile(payload);

      setProfiles(prev =>
        editingId
          ? prev.map(row => (row._id === profile._id ? profile : row))
          : [profile, ...prev],
      );
      setDraft(defaultDraft);
      setEditingId(null);
      await getCulturalProfilesOverview().then(setConfig);
    }
    catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save cultural profile.");
    }
    finally {
      setIsSaving(false);
    }
  };

  const startEdit = (profile: AdminCulturalProfileRecord) => {
    setDraft(toDraft(profile));
    setEditingId(profile._id);
    setError(null);
  };

  const cancelEdit = () => {
    setDraft(defaultDraft);
    setEditingId(null);
  };

  const toggleActive = async (profile: AdminCulturalProfileRecord) => {
    setIsSaving(true);

    try {
      const updated = await patchAdminCulturalProfile(profile._id, {
        isActive: !profile.isActive,
      });
      setProfiles(prev => prev.map(row => (row._id === updated._id ? updated : row)));
      await getCulturalProfilesOverview().then(setConfig);
    }
    catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update cultural profile.");
    }
    finally {
      setIsSaving(false);
    }
  };

  const removeProfile = async (profile: AdminCulturalProfileRecord) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Delete "${profile.name}" from cultural profiles?`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      await deleteAdminCulturalProfile(profile._id);
      setProfiles(prev => prev.filter(row => row._id !== profile._id));
      await getCulturalProfilesOverview().then(setConfig);
    }
    catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete cultural profile.");
    }
    finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminOperationsSectionPage
        config={config}
        onRefreshConfig={refreshAll}
      />

      <section className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-2 border-b border-[#E5ECF3] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[18px] font-semibold text-[#1E293B]">Managed Cultural Profiles</h3>
            <p className="mt-1 text-[12px] text-[#607B90]">
              Admin-created records power client profile choices and sanitized cultural guidance after validation.
            </p>
          </div>
          {isLoading ? <span className="text-[12px] font-semibold text-[#0F67AE]">Loading...</span> : null}
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-[#F4C7C3] bg-[#FFF7F6] px-3 py-2 text-[12px] text-[#B42318]">
            {error}
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-[15px] font-semibold text-[#1E293B]">
                {editingId ? "Edit Profile" : "Create Profile"}
              </h4>
              <p className="mt-1 text-[12px] text-[#607B90]">
                Validated and active records are the only ones exposed to user-facing endpoints.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex h-9 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-3 text-[12px] font-semibold text-[#52667A] transition hover:bg-[#F8FBFF]"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Type</span>
              <select
                value={draft.communityType}
                onChange={event => setDraft(prev => ({
                  ...prev,
                  communityType: event.target.value as AdminCulturalProfileType,
                }))}
                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
              >
                <option value="cultural">Cultural</option>
                <option value="faith">Faith</option>
                <option value="community">Community</option>
              </select>
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Key</span>
              <input
                value={draft.key}
                onChange={event => setDraft(prev => ({ ...prev, key: event.target.value }))}
                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
              />
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Name</span>
              <input
                value={draft.name}
                onChange={event => setDraft(prev => ({ ...prev, name: event.target.value }))}
                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
              />
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Status</span>
              <select
                value={draft.validationStatus}
                onChange={event => setDraft(prev => ({
                  ...prev,
                  validationStatus: event.target.value as AdminCulturalProfileStatus,
                }))}
                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending review</option>
                <option value="validated">Validated</option>
                <option value="needs_update">Needs update</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Languages</span>
              <input
                value={draft.languages}
                onChange={event => setDraft(prev => ({ ...prev, languages: event.target.value }))}
                placeholder="en, ar, hi"
                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
              />
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Faith pathway</span>
              <input
                value={draft.faithPathway}
                onChange={event => setDraft(prev => ({ ...prev, faithPathway: event.target.value }))}
                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
              />
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Review cadence</span>
              <input
                value={draft.reviewCadence}
                onChange={event => setDraft(prev => ({ ...prev, reviewCadence: event.target.value }))}
                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
              />
            </label>
            <label className="flex h-10 items-center gap-2 self-end text-[12px] font-semibold text-[#52667A]">
              <input
                type="checkbox"
                checked={draft.partnerReviewRequired}
                onChange={event => setDraft(prev => ({
                  ...prev,
                  partnerReviewRequired: event.target.checked,
                }))}
              />
              Partner review required
            </label>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <label className="space-y-1 text-[12px] text-[#52667A] lg:col-span-3">
              <span>Response guidance</span>
              <textarea
                value={draft.responseGuidance}
                onChange={event => setDraft(prev => ({ ...prev, responseGuidance: event.target.value }))}
                className="min-h-24 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 py-2 text-[13px] text-[#1E293B]"
              />
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Referral preferences</span>
              <textarea
                value={draft.referralPreferences}
                onChange={event => setDraft(prev => ({ ...prev, referralPreferences: event.target.value }))}
                className="min-h-20 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 py-2 text-[13px] text-[#1E293B]"
              />
            </label>
            <label className="space-y-1 text-[12px] text-[#52667A]">
              <span>Content guidance</span>
              <textarea
                value={draft.contentGuidance}
                onChange={event => setDraft(prev => ({ ...prev, contentGuidance: event.target.value }))}
                className="min-h-20 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 py-2 text-[13px] text-[#1E293B]"
              />
            </label>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-[12px] font-semibold text-[#52667A]">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={event => setDraft(prev => ({ ...prev, isActive: event.target.checked }))}
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={isSaving || !draft.key.trim() || !draft.name.trim() || !draft.responseGuidance.trim()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F67AE] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0B578F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingId ? "Save changes" : "Create profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search profiles"
              className="h-10 rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
            />
            <select
              value={typeFilter}
              onChange={event => setTypeFilter(event.target.value as AdminCulturalProfileType | "all")}
              className="h-10 rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
            >
              <option value="all">All types</option>
              <option value="cultural">Cultural</option>
              <option value="faith">Faith</option>
              <option value="community">Community</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#D8E3EE] bg-white px-4 text-[13px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
          >
            Refresh profiles
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {visibleProfiles.map(profile => (
            <article key={profile._id} className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[15px] font-semibold text-[#1E293B]">{profile.name}</h4>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(profile.validationStatus)}`}>
                      {profile.validationStatus.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-[#EEF6FF] px-2 py-1 text-[10px] font-semibold text-[#0F67AE]">
                      {profile.communityType}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#607B90]">
                    {profile.key}
                    {" • "}
                    {profile.languages.join(", ") || "No languages"}
                    {" • "}
                    {profile.isActive ? "Active" : "Inactive"}
                  </p>
                  <p className="mt-2 max-w-4xl text-[12px] leading-5 text-[#52667A]">
                    {profile.responseGuidance}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(profile)}
                    disabled={isSaving}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(profile)}
                    disabled={isSaving}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {profile.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeProfile(profile)}
                    disabled={isSaving}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#F4C7C3] px-3 text-[12px] font-semibold text-[#B42318] transition hover:bg-[#FFF7F6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!visibleProfiles.length && !isLoading ? (
            <div className="rounded-lg border border-[#D8E3EE] bg-[#FBFDFF] px-3 py-4 text-[12px] text-[#607B90]">
              No cultural profile records match this view yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
