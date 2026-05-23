import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { AboutPageContent } from "@/lib/content-pages";

import { getAdminContentPage } from "@/lib/content-pages";
import { APP_ROUTE_PATHS } from "@/routes/paths";

const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  eyebrow: "Basic Content Management",
  title: "About SafeSpeak",
  body:
    "SafeSpeak is positioned as a culturally responsive, trauma-informed reporting and support platform. This admin surface manages the operational systems behind that promise: routing, intelligence, multilingual support, crisis response, and compliance oversight.",
  commitments: [
    "Trauma-informed reporting and support design for people experiencing racism, abuse, or online harm.",
    "Culturally responsive workflows that respect faith, language, and community context across Australia.",
    "Operational routing to police, legal aid, community services, and emergency pathways when needed.",
    "Privacy, evidence integrity, and compliance controls designed for sensitive victim data.",
  ],
};

const ABOUT_PAGE_KEY = "about-us";

export function AdminAboutPanel() {
  const [content, setContent] = useState<AboutPageContent>(DEFAULT_ABOUT_CONTENT);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        const contentPage = await getAdminContentPage<AboutPageContent>(ABOUT_PAGE_KEY);

        if (isMounted) {
          setContent({
            ...DEFAULT_ABOUT_CONTENT,
            ...contentPage.draft,
          });
        }
      }
      catch {
        if (isMounted) {
          setContent(DEFAULT_ABOUT_CONTENT);
        }
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#607B90]">{content.eyebrow}</p>
        <h2 className="mt-2 text-[30px] font-semibold leading-none text-[#1E293B] sm:text-[34px]">{content.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607B90]">
          {content.body}
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
        <article className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <h3 className="text-[18px] font-semibold text-[#1E293B]">Platform Commitments</h3>
          <ul className="mt-4 space-y-3">
            {content.commitments.map(item => (
              <li
                key={item}
                className="rounded-xl border border-[#E5ECF3] bg-[#FBFDFF] px-4 py-3 text-[14px] leading-6 text-[#475569]"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <aside className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <h3 className="text-[18px] font-semibold text-[#1E293B]">Related Areas</h3>
          <div className="mt-4 space-y-3">
            <Link
              to={APP_ROUTE_PATHS.adminContentLandingPage}
              className="block rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 transition hover:border-[#0F67AE] hover:bg-[#EEF6FF]"
            >
              <p className="text-[14px] font-semibold text-[#1E293B]">Landing Page</p>
              <p className="mt-2 text-[12px] leading-5 text-[#607B90]">Review public-facing copy, hero content, and platform positioning.</p>
            </Link>
            <Link
              to={APP_ROUTE_PATHS.adminLegalCompliance}
              className="block rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 transition hover:border-[#0F67AE] hover:bg-[#EEF6FF]"
            >
              <p className="text-[14px] font-semibold text-[#1E293B]">Legal Compliance</p>
              <p className="mt-2 text-[12px] leading-5 text-[#607B90]">Check disclaimers, youth safety safeguards, and regulatory reporting workflows.</p>
            </Link>
            <Link
              to={APP_ROUTE_PATHS.adminDashboard}
              className="block rounded-xl border border-[#D8E3EE] bg-[#FBFDFF] px-4 py-3 transition hover:border-[#0F67AE] hover:bg-[#EEF6FF]"
            >
              <p className="text-[14px] font-semibold text-[#1E293B]">Dashboard</p>
              <p className="mt-2 text-[12px] leading-5 text-[#607B90]">Return to the command overview for the full admin operating model.</p>
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
