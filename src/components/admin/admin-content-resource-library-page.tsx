import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import {
  deleteContentResource,
  getContentResourceDownloadUrl,
  getContentResourceImageUrl,
  listAdminContentResources,
  type ContentResourceItem,
} from "@/lib/content-resources";
import { APP_ROUTE_PATHS } from "@/routes/paths";
import { Download, ImageIcon, MoreVertical, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const FILTERS = ["All Resources", "Legal Awareness", "Online Abuse", "Family Safety", "Youth Support"] as const;

function categoryClass(category: string) {
  if (category === "Legal Awareness") {
    return "bg-[#E5ECFF] text-[#1D4ED8]";
  }
  if (category === "Online Abuse") {
    return "bg-[#EFE3FF] text-[#7C3AED]";
  }
  if (category === "School Safety") {
    return "bg-[#FFEAD5] text-[#C2410C]";
  }
  return "bg-[#DCFCE7] text-[#15803D]";
}

function statusClass(status: string) {
  if (status === "Expiring Soon") {
    return "text-[#D97706]";
  }
  if (status === "Draft" || status === "Archived") {
    return "text-[#64748B]";
  }
  if (status === "Outdated") {
    return "text-[#B45309]";
  }
  return "text-[#15803D]";
}

const PAGE_SIZE = 2;
const ACTION_MENU_WIDTH = 152;
const ACTION_MENU_HEIGHT = 122;

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function statusLabel(status: ContentResourceItem["displayStatus"]) {
  return status.toUpperCase();
}

export function AdminContentResourceLibraryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("All Resources");
  const [activePage, setActivePage] = useState(1);
  const [resources, setResources] = useState<ContentResourceItem[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(() => {
    const state = location.state as { statusMessage?: string } | null;
    return state?.statusMessage ?? null;
  });

  const loadResources = useCallback(async () => {
    setIsLoading(true);

    try {
      const items = await listAdminContentResources();
      setResources(items);
    }
    catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not load resources.");
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  useEffect(() => {
    if (!openActionId) {
      return;
    }

    const closeActionMenu = () => {
      setOpenActionId(null);
      setActionMenuPosition(null);
    };

    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);

    return () => {
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
    };
  }, [openActionId]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return resources.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0
        || item.name.toLowerCase().includes(normalizedSearch)
        || item.language.toLowerCase().includes(normalizedSearch)
        || item.category.toLowerCase().includes(normalizedSearch)
        || item.originalFileName.toLowerCase().includes(normalizedSearch)
        || (item.imageOriginalFileName?.toLowerCase().includes(normalizedSearch) ?? false);

      const matchesFilter = activeFilter === "All Resources"
        || item.category === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, resources, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = filteredRows.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const activeActionItem = resources.find(item => item.id === openActionId) ?? null;

  const toggleActionMenu = (item: ContentResourceItem, event: MouseEvent<HTMLButtonElement>) => {
    if (openActionId === item.id) {
      setOpenActionId(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const topCandidate = rect.bottom + 8;
    const top = topCandidate + ACTION_MENU_HEIGHT > window.innerHeight - 12
      ? Math.max(12, rect.top - ACTION_MENU_HEIGHT - 8)
      : topCandidate;
    const left = Math.min(
      Math.max(12, rect.right - ACTION_MENU_WIDTH),
      window.innerWidth - ACTION_MENU_WIDTH - 12,
    );

    setOpenActionId(item.id);
    setActionMenuPosition({ left, top });
  };

  const closeActionMenu = () => {
    setOpenActionId(null);
    setActionMenuPosition(null);
  };

  const handleDelete = async (item: ContentResourceItem) => {
    const confirmed = window.confirm(`Delete ${item.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteContentResource(item.id);
      setResources(currentResources => currentResources.filter(resource => resource.id !== item.id));
      setStatusMessage(`Deleted ${item.name}.`);
      closeActionMenu();
    }
    catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not delete resource.");
    }
  };

  return (
    <AdminContentManagementShell>
      <section className="space-y-4 rounded-[12px] border border-[#D9E2EC] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[26px] font-semibold leading-none text-[#0F172A] sm:text-[30px]">Resource Library</h3>
            <p className="mt-1 text-xs text-[#607B90]">Manage downloadable assets, training materials, and safety resources.</p>
            {statusMessage
              ? <p className="mt-2 text-[12px] font-medium text-[#0F67AE]">{statusMessage}</p>
              : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setActivePage(1);
                }}
                placeholder="Search resources..."
                className="h-8 w-full rounded-full border border-[#D8E3EE] bg-white pl-8 pr-3 text-xs text-[#334155] outline-none transition focus:border-[#0F67AE] sm:w-[190px]"
              />
            </label>
            <button
              type="button"
              onClick={() => navigate(`${APP_ROUTE_PATHS.adminContentUploadResource}?mode=bulk`)}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-[#F59E0B] px-3 text-[11px] font-semibold text-white transition hover:bg-[#D88B07]"
            >
              <Upload className="h-3.5 w-3.5" />
              Bulk Upload
            </button>
            <button
              type="button"
              onClick={() => navigate(APP_ROUTE_PATHS.adminContentUploadResource)}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-[#0F67AE] px-3 text-[11px] font-semibold text-white transition hover:bg-[#0B578F]"
            >
              <Plus className="h-3.5 w-3.5" />
              New Resource
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {FILTERS.map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                setActivePage(1);
                setStatusMessage(`Showing ${filter.toLowerCase()}.`);
              }}
              className={filter === activeFilter
                ? "rounded-full bg-[#EDF5FF] px-2 py-1 font-semibold text-[#0F67AE]"
                : "rounded-full border border-[#D8E3EE] px-2 py-1 text-[#607B90] transition hover:bg-[#F8FBFF]"
              }
            >
              {filter}
            </button>
          ))}
        </div>

        {activeActionItem && actionMenuPosition
          ? (
              <>
                <button
                  type="button"
                  aria-label="Close resource actions"
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                  onClick={closeActionMenu}
                />
                <div
                  className="fixed z-50 w-[152px] overflow-hidden rounded-lg border border-[#D8E3EE] bg-white py-1 text-[11px] shadow-[0_18px_36px_rgba(15,23,42,0.18)]"
                  style={{
                    left: actionMenuPosition.left,
                    top: actionMenuPosition.top,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`${APP_ROUTE_PATHS.adminContentUploadResource}?resourceId=${activeActionItem.id}`);
                      closeActionMenu();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[#334155] transition hover:bg-[#F8FBFF]"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#0F67AE]" />
                    Edit
                  </button>
                  <a
                    href={getContentResourceDownloadUrl(activeActionItem)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={closeActionMenu}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[#334155] transition hover:bg-[#F8FBFF]"
                  >
                    <Download className="h-3.5 w-3.5 text-[#0F67AE]" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleDelete(activeActionItem)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[#B42318] transition hover:bg-[#FFF5F5]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )
          : null}

        <div className="overflow-x-auto rounded-[10px] border border-[#D5DEE7]">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-[#F8FBFF]">
              <tr className="text-[10px] uppercase tracking-wide text-[#607B90]">
                <th className="px-3 py-2 font-semibold"><input type="checkbox" readOnly /></th>
                <th className="px-3 py-2 font-semibold">Resource / Asset Name</th>
                <th className="px-3 py-2 font-semibold">Language</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Jurisdiction</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-[#607B90]">
                        Loading resources...
                      </td>
                    </tr>
                  )
                : null}
              {paginatedRows.map(item => (
                <tr key={item.id} className="border-t border-[#E4EAF1] text-[12px] text-[#1E293B]">
                  <td className="px-3 py-2.5"><input type="checkbox" readOnly /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {getContentResourceImageUrl(item)
                        ? (
                            <img
                              src={getContentResourceImageUrl(item)}
                              alt=""
                              className="h-10 w-10 rounded-md border border-[#D8E3EE] object-cover"
                            />
                          )
                        : (
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D8E3EE] bg-[#F8FBFF] text-[#94A3B8]">
                              <ImageIcon className="h-4 w-4" />
                            </span>
                          )}
                      <div className="min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[10px] text-[#94A3B8]">
                          {formatBytes(item.fileSizeBytes)}
                          {" | "}
                          {item.originalFileName}
                        </p>
                        {item.imageOriginalFileName
                          ? <p className="truncate text-[10px] text-[#94A3B8]">Image: {item.imageOriginalFileName}</p>
                          : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[#475569]">{item.language}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryClass(item.category)}`}>{item.category}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[#475569]">{item.jurisdiction}</td>
                  <td className={`px-3 py-2.5 text-[11px] font-semibold ${statusClass(item.displayStatus)}`}>
                    {statusLabel(item.displayStatus)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="relative inline-flex">
                      <button
                        type="button"
                        onClick={(event) => toggleActionMenu(item, event)}
                        aria-expanded={openActionId === item.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#607B90] transition hover:bg-[#EEF3F8] hover:text-[#0F67AE]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && paginatedRows.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-[#607B90]">
                        No resources matched this filter.
                      </td>
                    </tr>
                  )
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 text-[10px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#607B90]">
            Showing
            {" "}
            {filteredRows.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1}
            -
            {Math.min(activePage * PAGE_SIZE, filteredRows.length)}
            {" of "}
            {filteredRows.length}
            {" matching resources"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => setActivePage(prev => Math.max(1, prev - 1))}
              className="h-7 rounded border border-[#D8E3EE] px-3 text-[#607B90] transition enabled:hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => setActivePage(prev => Math.min(totalPages, prev + 1))}
              className="h-7 rounded border border-[#D8E3EE] px-3 text-[#607B90] transition enabled:hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
