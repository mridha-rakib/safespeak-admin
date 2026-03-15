import { APP_ROUTE_PATHS } from "@/routes/paths";
import { Link } from "react-router-dom";

const COMMITMENTS = [
  "Trauma-informed reporting and support design for people experiencing racism, abuse, or online harm.",
  "Culturally responsive workflows that respect faith, language, and community context across Australia.",
  "Operational routing to police, legal aid, community services, and emergency pathways when needed.",
  "Privacy, evidence integrity, and compliance controls designed for sensitive victim data.",
] as const;

export function AdminAboutPanel() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#607B90]">Basic Content Management</p>
        <h2 className="mt-2 text-[30px] font-semibold leading-none text-[#1E293B] sm:text-[34px]">About SafeSpeak</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607B90]">
          SafeSpeak is positioned as a culturally responsive, trauma-informed reporting and support platform.
          This admin surface manages the operational systems behind that promise: routing, intelligence,
          multilingual support, crisis response, and compliance oversight.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
        <article className="rounded-xl border border-[#CAD7E3] bg-white p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
          <h3 className="text-[18px] font-semibold text-[#1E293B]">Platform Commitments</h3>
          <ul className="mt-4 space-y-3">
            {COMMITMENTS.map(item => (
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
