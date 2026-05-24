import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  getAdminContentPage,
  publishAdminContentPage,
  saveAdminContentPage,
  type ContentPageKey,
  type LegalDocumentContent,
} from "@/lib/content-pages";
import { APP_ROUTE_PATHS } from "@/routes/paths";

type LegalDocumentPageKey = Extract<ContentPageKey, "privacy-policy" | "terms-conditions">;

type AdminLegalDocumentPanelProps = {
  pageKey: LegalDocumentPageKey;
  title: string;
  fallbackHtml: string;
  loadErrorMessage: string;
  saveSuccessMessage: string;
  publishSuccessMessage: string;
  saveErrorMessage: string;
  publishErrorMessage: string;
};

const TOOLBAR_ACTIONS = [
  { id: "h2", label: "H2", icon: null },
  { id: "bold", label: "B", icon: Bold },
  { id: "italic", label: "I", icon: Italic },
  { id: "underline", label: "U", icon: Underline },
  { id: "alignLeft", label: "Align left", icon: AlignLeft },
  { id: "alignCenter", label: "Align center", icon: AlignCenter },
  { id: "alignRight", label: "Align right", icon: AlignRight },
  { id: "alignJustify", label: "Justify", icon: AlignJustify },
] as const;

type ToolbarAction = (typeof TOOLBAR_ACTIONS)[number]["id"];
type ToolbarState = Record<ToolbarAction, boolean>;

const INITIAL_TOOLBAR_STATE: ToolbarState = {
  h2: false,
  bold: false,
  italic: false,
  underline: false,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  alignJustify: false,
};

function formatPublishedAt(value?: string) {
  if (!value) {
    return "Not published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Published date unavailable";
  }

  return `Published ${date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function getEditorHtml(editor: HTMLDivElement | null) {
  return editor?.innerHTML.trim() ?? "";
}

function hasEditorText(editor: HTMLDivElement | null) {
  return Boolean(editor?.textContent?.trim());
}

export function AdminLegalDocumentPanel({
  pageKey,
  title,
  fallbackHtml,
  loadErrorMessage,
  saveSuccessMessage,
  publishSuccessMessage,
  saveErrorMessage,
  publishErrorMessage,
}: AdminLegalDocumentPanelProps) {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [toolbarState, setToolbarState] = useState<ToolbarState>(INITIAL_TOOLBAR_STATE);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | undefined>();
  const [version, setVersion] = useState<number | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = fallbackHtml;
    }
  }, [fallbackHtml]);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);

      try {
        const contentPage = await getAdminContentPage<LegalDocumentContent>(pageKey);

        if (!isMounted) {
          return;
        }

        if (editorRef.current) {
          editorRef.current.innerHTML = contentPage.draft.contentHtml || fallbackHtml;
        }

        setPublishedAt(contentPage.publishedAt);
        setVersion(contentPage.version);
        setHasUnpublishedChanges(Boolean(contentPage.hasUnpublishedChanges));
        setStatusMessage(null);
      }
      catch (error) {
        if (isMounted) {
          setStatusMessage(error instanceof Error ? error.message : loadErrorMessage);
        }
      }
      finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [fallbackHtml, loadErrorMessage, pageKey]);

  const syncToolbarState = () => {
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;

    try {
      setToolbarState({
        h2: anchorElement?.closest("h2") != null,
        bold: Boolean(document.queryCommandState("bold")),
        italic: Boolean(document.queryCommandState("italic")),
        underline: Boolean(document.queryCommandState("underline")),
        alignLeft: Boolean(document.queryCommandState("justifyLeft")),
        alignCenter: Boolean(document.queryCommandState("justifyCenter")),
        alignRight: Boolean(document.queryCommandState("justifyRight")),
        alignJustify: Boolean(document.queryCommandState("justifyFull")),
      });
    }
    catch {
      setToolbarState(INITIAL_TOOLBAR_STATE);
    }
  };

  const applyEditorAction = (action: ToolbarAction) => {
    editorRef.current?.focus();

    switch (action) {
      case "h2":
        document.execCommand("formatBlock", false, toolbarState.h2 ? "p" : "h2");
        break;
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "underline":
        document.execCommand("underline");
        break;
      case "alignLeft":
        document.execCommand("justifyLeft");
        break;
      case "alignCenter":
        document.execCommand("justifyCenter");
        break;
      case "alignRight":
        document.execCommand("justifyRight");
        break;
      case "alignJustify":
        document.execCommand("justifyFull");
        break;
    }

    setHasUnpublishedChanges(true);
    syncToolbarState();
  };

  const applyServerState = (contentPage: Awaited<ReturnType<typeof getAdminContentPage<LegalDocumentContent>>>) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = contentPage.draft.contentHtml || fallbackHtml;
    }

    setPublishedAt(contentPage.publishedAt);
    setVersion(contentPage.version);
    setHasUnpublishedChanges(Boolean(contentPage.hasUnpublishedChanges));
  };

  const handleSaveDraft = async () => {
    if (!hasEditorText(editorRef.current)) {
      setStatusMessage("Add legal content before saving.");
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const contentPage = await saveAdminContentPage<LegalDocumentContent>(pageKey, {
        contentHtml: getEditorHtml(editorRef.current),
      });

      applyServerState(contentPage);
      setStatusMessage(saveSuccessMessage);
    }
    catch (error) {
      setStatusMessage(error instanceof Error ? error.message : saveErrorMessage);
    }
    finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!hasEditorText(editorRef.current)) {
      setStatusMessage("Add legal content before publishing.");
      return;
    }

    setIsPublishing(true);
    setStatusMessage(null);

    try {
      const contentPage = await publishAdminContentPage<LegalDocumentContent>(pageKey, {
        contentHtml: getEditorHtml(editorRef.current),
      });

      applyServerState(contentPage);
      setStatusMessage(publishSuccessMessage);
    }
    catch (error) {
      setStatusMessage(error instanceof Error ? error.message : publishErrorMessage);
    }
    finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTE_PATHS.adminSettings)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/95 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Back to settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="admin-panel-title truncate font-semibold leading-none text-white">{title}</h2>
            <p className="mt-1 text-[11px] font-medium text-white/80">
              {formatPublishedAt(publishedAt)}
              {version ? ` | Version ${version}` : ""}
              {hasUnpublishedChanges ? " | Draft changes pending" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading || isSaving || isPublishing}
            onClick={() => void handleSaveDraft()}
            className="h-[40px] min-w-[104px] rounded-md border border-[#D8E3EE] bg-white text-[14px] font-semibold text-[#0F67AE] hover:bg-[#F2F7FD]"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="button"
            disabled={isLoading || isSaving || isPublishing}
            onClick={() => void handlePublish()}
            className="h-[40px] min-w-[96px] rounded-md bg-[#FF8F00] text-[14px] font-semibold text-white hover:bg-[#F57C00]"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="admin-panel-min-h px-4 pb-6 pt-5 sm:px-6">
        {statusMessage
          ? <p className="mb-3 rounded-md bg-[#EEF6FF] px-3 py-2 text-[13px] font-medium text-[#0F67AE]">{statusMessage}</p>
          : null}

        <div
          ref={editorRef}
          contentEditable={!isLoading}
          suppressContentEditableWarning
          onInput={() => {
            setHasUnpublishedChanges(true);
            syncToolbarState();
          }}
          onKeyUp={syncToolbarState}
          onMouseUp={syncToolbarState}
          className="h-[468px] overflow-y-auto rounded-lg border border-[#D8E3EE] bg-white p-4 text-[14px] leading-[1.65] text-[#3B4551] outline-none transition focus:ring-2 focus:ring-[#4BA3D9] [&_h2]:mb-3 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:text-[#1E293B] [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-5 [&_p:last-child]:mb-0 [&_ul]:mb-5"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#DFE7EF] bg-[#FCFDFE] px-3 py-2">
          <p className="text-[12px] font-medium text-[#607B90]">
            Save Draft keeps changes internal. Publish updates the public page.
          </p>

          <div className="flex items-center gap-1">
            {TOOLBAR_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isActive = toolbarState[action.id];

              return (
                <button
                  key={action.label}
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => applyEditorAction(action.id)}
                  disabled={isLoading}
                  className={`inline-flex h-7 min-w-7 items-center justify-center rounded border px-1.5 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive
                      ? "border-[#0F67AE] bg-[#EAF2FB] text-[#0F67AE]"
                      : "border-[#DEE6EF] bg-white text-[#607B90] hover:bg-[#F3F7FC]"
                  }`}
                  aria-label={action.label}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
