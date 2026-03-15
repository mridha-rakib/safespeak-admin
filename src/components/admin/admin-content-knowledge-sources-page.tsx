import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { Plus, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";

type KnowledgeSource = {
  sourceName: string;
  category: string;
  age: string;
  status: string;
};

const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    sourceName: "New Cyber Policy 2024",
    category: "Legislation",
    age: "2 mins ago",
    status: "Ingested",
  },
  {
    sourceName: "Phishing Pattern: Crypto-Romance",
    category: "Scam Pattern",
    age: "1 hour ago",
    status: "Pending Review",
  },
  {
    sourceName: "GDPR Amendment v3.2",
    category: "Regulation",
    age: "Yesterday",
    status: "Ingested",
  },
] as const;

const TEMPLATE_TABS = [
  {
    id: "risk-phrasing",
    label: "Risk Phrasing",
    value: `Based on recent reports of {Scam_Type}, we have identified a high probability of fraudulent activity.\n\nThis pattern typically involves long-term emotional manipulation followed by requests for cryptocurrency transfers.\n\nRecommendation: Cease all communication immediately. Do not transfer any funds. The platform advises users to report this profile.`,
  },
  {
    id: "disclaimer-phrasing",
    label: "Disclaimer Phrasing",
    value: `SafeSpeak provides guidance and referral support, not legal advice.\n\nBefore sharing information with a partner organization, confirm the user's consent status and review any jurisdiction-specific requirements.\n\nUse plain, non-judgmental language in every explanation.`,
  },
  {
    id: "general-responses",
    label: "General Responses",
    value: `Acknowledge the user's experience, summarise the immediate safety steps, and provide the next best support option.\n\nWhen confidence is low, route the draft to human review before publishing or sharing externally.`,
  },
] as const;

function categoryClass(category: string) {
  if (category === "Legislation") {
    return "bg-[#E5ECFF] text-[#3B5BCC]";
  }
  if (category === "Scam Pattern") {
    return "bg-[#FFE8EA] text-[#D14343]";
  }
  return "bg-[#EFE3FF] text-[#7C3AED]";
}

function ingestionClass(status: string) {
  if (status === "Ingested") {
    return "bg-[#DCFCE7] text-[#0F7A43]";
  }
  return "bg-[#FFF0D9] text-[#B45309]";
}

export function AdminContentKnowledgeSourcesPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([...KNOWLEDGE_SOURCES]);
  const [selectedSourceName, setSelectedSourceName] = useState<string>(KNOWLEDGE_SOURCES[1].sourceName);
  const [activeTemplateTab, setActiveTemplateTab] = useState<(typeof TEMPLATE_TABS)[number]["id"]>(TEMPLATE_TABS[0].id);
  const [statusMessage, setStatusMessage] = useState<string | null>("Knowledge-source workflows are active.");

  const selectedSource = useMemo(
    () => sources.find(source => source.sourceName === selectedSourceName) ?? sources[0],
    [selectedSourceName, sources],
  );

  const activeTemplate = TEMPLATE_TABS.find(tab => tab.id === activeTemplateTab) ?? TEMPLATE_TABS[0];

  return (
    <AdminContentManagementShell>
      <section className="space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#1E293B]">Recent Knowledge Sources</p>
            {statusMessage
              ? <p className="mt-1 text-[12px] font-medium text-[#0F67AE]">{statusMessage}</p>
              : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusMessage("Source scan requested. Reviewing the latest policy and scam updates.")}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D8E3EE] bg-white px-3 text-[11px] font-semibold text-[#334155] transition hover:bg-[#F8FBFF]"
            >
              <RefreshCcw className="h-3 w-3" />
              Re-scan Sources
            </button>
            <button
              type="button"
              onClick={() => {
                const newSource = {
                  sourceName: "Community Safety Bulletin",
                  category: "Regulation",
                  age: "Just now",
                  status: "Pending Review",
                };
                setSources(prev => [newSource, ...prev]);
                setSelectedSourceName(newSource.sourceName);
                setStatusMessage("New source added to the review queue.");
              }}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#F59E0B] px-3 text-[11px] font-semibold text-white transition hover:bg-[#D88B07]"
            >
              <Plus className="h-3 w-3" />
              Add New Source
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[10px] border border-[#D5DEE7]">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead className="bg-[#F8FBFF]">
              <tr className="text-[10px] uppercase tracking-wide text-[#607B90]">
                <th className="px-3 py-2 font-semibold">Source Name</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Date Added</th>
                <th className="px-3 py-2 font-semibold">Ingestion Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(row => (
                <tr
                  key={row.sourceName}
                  className="cursor-pointer border-t border-[#E4EAF1] text-[12px] text-[#1E293B] transition hover:bg-[#F8FBFF]"
                  onClick={() => {
                    setSelectedSourceName(row.sourceName);
                    setStatusMessage(`Editing templates for ${row.sourceName}.`);
                  }}
                >
                  <td className="px-3 py-2.5 font-medium">{row.sourceName}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryClass(row.category)}`}>{row.category}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[#607B90]">{row.age}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ingestionClass(row.status)}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="rounded-[10px] border border-[#D8E3EE]">
          <div className="border-b border-[#E4EAF1] px-3 py-2">
            <h3 className="text-sm font-semibold text-[#1E293B]">Explanation Template Editor</h3>
            <p className="mt-0.5 text-[11px] text-[#607B90]">
              Editing response for:
              {" "}
              <span className="font-medium text-[#0F67AE]">{selectedSource.sourceName}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {TEMPLATE_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTemplateTab(tab.id)}
                  className={tab.id === activeTemplateTab
                    ? "rounded border border-[#0F67AE] bg-[#EEF6FF] px-2 py-0.5 font-medium text-[#0F67AE]"
                    : "rounded border border-[#D8E3EE] px-2 py-0.5 text-[#607B90] transition hover:bg-[#F8FBFF]"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-[#E4EAF1] px-3 py-2 text-[10px] text-[#607B90]">
            VARIABLES
            <span className="ml-2 rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[#1D4ED8]">{`{User_Name}`}</span>
            <span className="ml-1 rounded bg-[#FFE4E6] px-1.5 py-0.5 text-[#BE123C]">{`{Scam_Type}`}</span>
            <span className="ml-1 rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[#15803D]">{`{Risk_Level}`}</span>
          </div>

          <textarea
            rows={9}
            value={activeTemplate.value}
            readOnly
            className="w-full resize-none rounded-b-[10px] bg-white px-3 py-3 text-sm leading-6 text-[#334155]"
          />
        </section>

        <div className="flex flex-col gap-2 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#94A3B8]">Last auto-saved 10 seconds ago</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusMessage(`Draft saved for ${selectedSource.sourceName}.`)}
              className="inline-flex h-8 items-center rounded-md border border-[#D8E3EE] bg-white px-3 font-semibold text-[#334155] transition hover:bg-[#F8FBFF]"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => setStatusMessage(`Published ${activeTemplate.label.toLowerCase()} for ${selectedSource.sourceName}.`)}
              className="inline-flex h-8 items-center rounded-md bg-[#F59E0B] px-3 font-semibold text-white transition hover:bg-[#D88B07]"
            >
              Publish Update
            </button>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
