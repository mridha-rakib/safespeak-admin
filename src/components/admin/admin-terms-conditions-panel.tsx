import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  ImageUp,
  Italic,
  Underline,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { APP_ROUTE_PATHS } from "@/routes/paths";

type TermsConditionsValues = {
  contentHtml: string;
  image?: FileList;
};

const DEFAULT_TERMS_CONDITIONS = `Iacus nulla eu netus pretium. Pellentesque scelerisque tellus nisl eu nisl sed senectus nunc. Porta sollicitudin vel elit varius nulla sit diam sed. Bibendum elit facilisi nulla viverra augue pellentesque gravida morbi.

Diam pellentesque orci eget gravida cursus. Ut ut nulla sapien eget vitae at eget pretium. Tristique nibh ipsum iaculis quam. Vestibulum magna cursus facilisis adipiscing cras dui. Risus auctor faucibus orci tortor tristique elit. Sit tincidunt id felis malesuada placerat ultricies enim.

Purus ut congue ornare id sed. Enim libero tincidunt facilisis non facilisis mattis praesent. Magna volutpat at cras urna adipiscing vitae velit enim volutpat. Ac tincidunt et sed dolor ipsum. Purus nunc turpis scelerisque pellentesque lectus mauris imperdiet. Turpis orci consectetur enim posuere faucibus praesent.

Ut suscipit cursus id mauris. Accumsan egestas sit arcu sed. Feugiat tortor pharetra id ipsum elit diam viverra tortor. Mattis tincidunt eget ut nunc in. Mauris ipsum ut purus laoreet nisi eu viverra velit adipiscing. Diam sit cursus id semper sit. Urna morbi nisl est vel tincidunt.`;

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

function toEditorHtml(content: string) {
  return content
    .split("\n\n")
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${paragraph}</p>`)
    .join("");
}

export function AdminTermsConditionsPanel() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [toolbarState, setToolbarState] = useState<ToolbarState>(INITIAL_TOOLBAR_STATE);
  const defaultEditorHtml = useMemo(() => toEditorHtml(DEFAULT_TERMS_CONDITIONS), []);

  const { register, setValue, handleSubmit } = useForm<TermsConditionsValues>({
    defaultValues: {
      contentHtml: defaultEditorHtml,
    },
  });

  const { ref: contentHtmlRef, ...contentHtmlField } = register("contentHtml");
  const { ref: imageRef, ...imageField } = register("image");

  const onSubmit = (_values: TermsConditionsValues) => {};

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
    } catch {
      setToolbarState(INITIAL_TOOLBAR_STATE);
    }
  };

  const applyEditorAction = (action: ToolbarAction) => {
    editorRef.current?.focus();

    switch (action) {
      case "h2":
        if (toolbarState.h2) {
          document.execCommand("formatBlock", false, "p");
        } else {
          document.execCommand("formatBlock", false, "h2");
        }
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

    setValue("contentHtml", editorRef.current?.innerHTML ?? "", { shouldDirty: true });
    syncToolbarState();
  };

  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-between gap-3 rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(APP_ROUTE_PATHS.adminSettings)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/95 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Back to settings"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-[44px] font-semibold leading-none text-white">Terms & Conditions</h2>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="h-[44px] min-w-[98px] rounded-md border border-[#D8E3EE] bg-white text-[16px] font-semibold text-[#0F67AE] hover:bg-[#F2F7FD]"
          >
            Save
          </Button>
        </div>

        <div className="min-h-[903px] px-4 pb-6 pt-5 sm:px-6">
          <input
            type="hidden"
            {...contentHtmlField}
            ref={(element) => {
              contentHtmlRef(element);
            }}
          />
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              setValue("contentHtml", event.currentTarget.innerHTML, { shouldDirty: true });
              syncToolbarState();
            }}
            onKeyUp={syncToolbarState}
            onMouseUp={syncToolbarState}
            className="h-[430px] overflow-y-auto rounded-lg border border-[#D8E3EE] bg-white p-3 text-[14px] leading-[1.5] text-[#3B4551] outline-none transition focus:ring-2 focus:ring-[#4BA3D9] [&_h2]:mb-3 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:text-[#1E293B] [&_p]:mb-6 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: defaultEditorHtml }}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#DFE7EF] bg-[#FCFDFE] px-3 py-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#CFDAE6] bg-[#F4F8FC] text-[#8090A0] transition hover:bg-[#EDF3F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
                aria-label="Select image"
              >
                <ImageUp className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[13px] font-semibold text-[#1E293B]">Upload your image</p>
                <p className="text-[11px] text-[#7A8D9F]">jpg/png - Max. 5MB</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                {...imageField}
                ref={(element) => {
                  imageRef(element);
                  fileInputRef.current = element;
                }}
                onChange={(event) => {
                  imageField.onChange(event);
                  setSelectedFileName(event.target.files?.[0]?.name ?? "");
                }}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 rounded-[4px] bg-[#0F67AE] px-3 text-[11px] font-semibold text-white hover:bg-[#0A5792]"
              >
                Upload
              </Button>
              {selectedFileName
                ? <span className="max-w-[200px] truncate text-[11px] text-[#607B90]">{selectedFileName}</span>
                : null}
            </div>

            <div className="flex items-center gap-1">
              {TOOLBAR_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = toolbarState[action.id];

                return (
                  <button
                    key={action.label}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyEditorAction(action.id)}
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded border px-1 text-[10px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] ${
                      isActive
                        ? "border-[#0F67AE] bg-[#EAF2FB] text-[#0F67AE]"
                        : "border-[#DEE6EF] bg-white text-[#607B90] hover:bg-[#F3F7FC]"
                    }`}
                    aria-label={action.label}
                  >
                    {Icon ? <Icon className="h-3 w-3" /> : action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
