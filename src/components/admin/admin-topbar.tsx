import { APP_ROUTE_PATHS } from "@/routes/paths";
import { Bell, Menu, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminTopBar() {
  const navigate = useNavigate();

  return (
    <div className="flex h-[84px] items-center justify-between rounded-lg border border-[#CAD6E2] bg-[#FDFDFD] px-4 shadow-[0_1px_6px_rgba(0,0,0,0.24)]">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#1E3A4F] transition hover:bg-[#EEF3F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="leading-tight">
          <p className="text-[28px] font-semibold text-[#154760]">Welcome,James</p>
          <p className="text-[14px] text-[#4D6778]">Have a nice day!</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(APP_ROUTE_PATHS.adminNotifications)}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0F67AE] text-[#0F67AE] transition hover:bg-[#EEF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-[9px] top-[8px] h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
        </button>
        <button
          type="button"
          onClick={() => navigate(APP_ROUTE_PATHS.adminProfile)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0F67AE] text-[#0F67AE] transition hover:bg-[#EEF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]"
          aria-label="Profile"
        >
          <UserRound className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
