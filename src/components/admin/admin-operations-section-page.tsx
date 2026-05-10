import type { ReactNode } from "react";

import {
  createAdminDestination,
  createAdminTaxonomy,
  getAdminAnalyticsCategories,
  getAdminAnalyticsHeatmap,
  getAdminAnalyticsLanguages,
  getAdminAnalyticsOverview,
  getAdminAnalyticsTrends,
  listAdminDestinations,
  listAdminPrivacyRequests,
  listAdminTaxonomies,
  patchAdminDestination,
  patchAdminPrivacyRequest,
  patchAdminTaxonomy,
  type AdminAnalyticsBucket,
  type AdminAnalyticsOverview,
  type AdminDestinationRecord,
  type AdminPrivacyRequestRecord,
  type AdminTaxonomyRecord,
} from "@/lib/admin-operations";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

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
  | "analytics";

type LivePanelState = {
  isLoading: boolean;
  error: string | null;
  taxonomies: AdminTaxonomyRecord[];
  destinations: AdminDestinationRecord[];
  privacyRequests: AdminPrivacyRequestRecord[];
  analyticsOverview: AdminAnalyticsOverview | null;
  analyticsHeatmap: AdminAnalyticsBucket[];
  analyticsTrends: AdminAnalyticsBucket[];
  analyticsCategories: AdminAnalyticsBucket[];
  analyticsLanguages: AdminAnalyticsBucket[];
};

const defaultLivePanelState: LivePanelState = {
  isLoading: false,
  error: null,
  taxonomies: [],
  destinations: [],
  privacyRequests: [],
  analyticsOverview: null,
  analyticsHeatmap: [],
  analyticsTrends: [],
  analyticsCategories: [],
  analyticsLanguages: [],
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
  const [destinationDraft, setDestinationDraft] = useState({
    type: "agency" as AdminDestinationRecord["type"],
    name: "",
    endpoint: "",
  });
  const [isSubmittingLiveChange, setIsSubmittingLiveChange] = useState(false);

  const setActiveModule = (moduleId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("focus", moduleId);
    setSearchParams(nextSearchParams, { replace: true });
  };

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
        const destinations = await listAdminDestinations();

        if (isMounted) {
          setLivePanel({
            ...defaultLivePanelState,
            isLoading: false,
            destinations,
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
      setTaxonomyDraft({
        type: "incident_type",
        key: "",
        label: "",
        description: "",
      });
    }
    catch (error) {
      setLivePanel(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to create taxonomy.",
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
        name: destinationDraft.name,
        endpoint: destinationDraft.endpoint || undefined,
        isActive: true,
        metadata: {},
      });

      setLivePanel(prev => ({
        ...prev,
        destinations: [destination, ...prev.destinations],
        error: null,
      }));
      setDestinationDraft({
        type: "agency",
        name: "",
        endpoint: "",
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

  const toggleTaxonomyActive = async (item: AdminTaxonomyRecord) => {
    setIsSubmittingLiveChange(true);

    try {
      const taxonomy = await patchAdminTaxonomy(item._id, { isActive: !item.isActive });
      setLivePanel(prev => ({
        ...prev,
        taxonomies: prev.taxonomies.map(row => (row._id === item._id ? taxonomy : row)),
        error: null,
      }));
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
                        {sectionKey === "taxonomies" ? "Manage active incident, support, language, and culture taxonomy records."
                          : sectionKey === "destinations" ? "Review live destination routing records for agencies and services."
                            : sectionKey === "privacyRequests" ? "Update privacy request review state from the live backend queue."
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
                                onChange={event => setTaxonomyDraft(prev => ({
                                  ...prev,
                                  type: event.target.value as AdminTaxonomyRecord["type"],
                                }))}
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
                            {livePanel.taxonomies.slice(0, 8).map(item => (
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
                                  <button
                                    type="button"
                                    onClick={() => void toggleTaxonomyActive(item)}
                                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#D8E3EE] px-3 text-[12px] font-semibold text-[#0F67AE] transition hover:bg-[#EEF6FF]"
                                  >
                                    {item.isActive ? "Deactivate" : "Activate"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    : null}

                  {sectionKey === "destinations"
                    ? (
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-3 md:grid-cols-3">
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
                                <option value="agency">Agency</option>
                                <option value="support_service">Support Service</option>
                                <option value="webhook">Webhook</option>
                              </select>
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
                              <span>Endpoint</span>
                              <input
                                value={destinationDraft.endpoint}
                                onChange={event => setDestinationDraft(prev => ({ ...prev, endpoint: event.target.value }))}
                                className="h-10 w-full rounded-lg border border-[#D8E3EE] bg-white px-3 text-[13px] text-[#1E293B]"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDestinationCreate()}
                            disabled={isSubmittingLiveChange || !destinationDraft.name.trim()}
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
                                      {item.endpoint ? ` • ${item.endpoint}` : ""}
                                    </p>
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
