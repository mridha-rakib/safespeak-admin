import { CheckCircle2, ImageUp } from "lucide-react";
import { useEffect, useState } from "react";

import type { LandingPageContent } from "@/lib/content-pages";

import { AdminContentManagementShell } from "@/components/admin/admin-content-management-shell";
import { getAdminContentPage } from "@/lib/content-pages";

const LANDING_PAGE_KEY = "landing-page";

const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  heroHeadline: "Speak safely, anytime.",
  subheading: "Secure communication for everyone. Private, encrypted, and designed for peace of mind.",
  primaryButtonLabel: "Get Started",
  primaryButtonUrl: "/signup",
  secondaryButtonLabel: "Learn More",
  secondaryButtonUrl: "/about",
  backgroundVisualsEnabled: true,
};

function ContentField({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">{label}</p>
      <input
        type="text"
        value={value}
        readOnly
        className="h-9 w-full rounded-md border border-[#D8E3EE] bg-white px-3 text-sm text-[#1E293B]"
      />
    </label>
  );
}

export function AdminContentLandingPage() {
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        const contentPage = await getAdminContentPage<LandingPageContent>(LANDING_PAGE_KEY);

        if (isMounted) {
          setContent({
            ...DEFAULT_LANDING_CONTENT,
            ...contentPage.draft,
          });
        }
      }
      catch {
        if (isMounted) {
          setContent(DEFAULT_LANDING_CONTENT);
        }
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminContentManagementShell>
      <section className="w-full min-w-0 rounded-[12px] border border-[#D9E2EC] bg-white">
        <div className="flex items-center justify-between border-b border-[#E2EAF2] px-4 py-3">
          <div>
            <h3 className="text-[18px] font-semibold text-[#0F172A] sm:text-[20px]">Landing Page</h3>
          </div>
          <p className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
            Auto-saved 3m ago
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Text Content</p>
            <ContentField label="Hero Headline" value={content.heroHeadline} />
            <label className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Sub-heading</p>
              <textarea
                value={content.subheading}
                readOnly
                rows={3}
                className="w-full rounded-md border border-[#D8E3EE] bg-white px-3 py-2 text-sm text-[#1E293B]"
              />
            </label>
            <div className="flex items-start gap-2 rounded-md border border-[#CDEBD8] bg-[#EAF8F0] px-3 py-2 text-[#0F7A43]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Tone: Calm and reassuring</p>
                <p className="text-[11px]">Great for messaging prompts safety without inducing panic.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#607B90]">Calls To Action</p>
            <div className="grid gap-3 md:grid-cols-2">
              <ContentField label="Primary Button Label" value={content.primaryButtonLabel} />
              <ContentField label="Destination URL" value={content.primaryButtonUrl} />
              <ContentField label="Secondary Button Label (Optional)" value={content.secondaryButtonLabel ?? ""} />
              <ContentField label="Destination URL" value={content.secondaryButtonUrl ?? ""} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1E293B]">
              <input type="checkbox" checked={content.backgroundVisualsEnabled} readOnly className="h-3.5 w-3.5 rounded border-[#B7C6D6] text-[#0F67AE]" />
              Background Visuals
            </label>
            <div className="space-y-2">
              <div className="flex min-h-[122px] flex-col items-center justify-center rounded-md border border-dashed border-[#D8E3EE] bg-[#FAFCFF] text-[#94A3B8]">
                <ImageUp className="mb-1 h-4 w-4" />
                <p className="text-xs">Upload Image</p>
              </div>
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>Format: JPG, PNG</span>
                <span>Max: 2MB</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminContentManagementShell>
  );
}
