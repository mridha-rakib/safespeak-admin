import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { APP_ROUTE_PATHS } from "@/routes/paths";

type SettingsItem = {
  label: string;
  to?: string;
};

const SETTINGS_ITEMS: SettingsItem[] = [
  { label: "Change Password", to: APP_ROUTE_PATHS.adminChangePassword },
  { label: "Privacy Policy", to: APP_ROUTE_PATHS.adminPrivacyPolicy },
  { label: "Terms & Conditions", to: APP_ROUTE_PATHS.adminTermsConditions },
  { label: "About Us" },
];

export function AdminSettingsPanel() {
  return (
    <div className="rounded-xl border border-[#CAD7E3] bg-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <div className="rounded-t-xl bg-[#0F67AE] px-4 py-2.5">
        <h2 className="text-[44px] font-semibold leading-none text-white">Settings</h2>
      </div>

      <div className="min-h-[903px] px-4 pb-6 pt-1 sm:px-6">
        <ul>
          {SETTINGS_ITEMS.map(item => (
            <li key={item.label} className="border-b border-[#C4CFDA]">
              {item.to
                ? (
                    <Link
                      to={item.to}
                      className="flex h-[62px] w-full items-center justify-between text-left text-[36px] font-medium text-[#1E293B] transition hover:bg-[#F7FAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-5 w-5 text-[#334155]" aria-hidden="true" />
                    </Link>
                  )
                : (
                    <button
                      type="button"
                      className="flex h-[62px] w-full items-center justify-between text-left text-[36px] font-medium text-[#1E293B] transition hover:bg-[#F7FAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-5 w-5 text-[#334155]" aria-hidden="true" />
                    </button>
                  )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
