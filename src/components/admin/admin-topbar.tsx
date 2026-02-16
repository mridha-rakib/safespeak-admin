import { APP_ROUTE_PATHS } from "@/routes/paths";
import { Bell, Menu, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

type AdminTopBarProps = {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

export function AdminTopBar({ onMenuClick, showMenuButton = true }: AdminTopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 rounded-lg border border-[#CAD6E2] bg-[#FDFDFD] px-3 py-3 shadow-[0_1px_6px_rgba(0,0,0,0.24)] sm:min-h-[84px] sm:flex-nowrap sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
        {showMenuButton
          ? (
              <button
                type="button"
                onClick={onMenuClick}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#1E3A4F] transition hover:bg-[#EEF3F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )
          : null}

        <div className="min-w-0 leading-tight">
          <p className="truncate text-[22px] font-semibold text-[#154760] sm:text-[24px] lg:text-[28px]">Welcome,James</p>
          <p className="text-[12px] text-[#4D6778] sm:text-[14px]">Have a nice day!</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(APP_ROUTE_PATHS.adminNotifications)}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0F67AE] text-[#0F67AE] transition hover:bg-[#EEF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] sm:h-11 sm:w-11"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute right-[9px] top-[8px] h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
        </button>
        <button
          type="button"
          onClick={() => navigate(APP_ROUTE_PATHS.adminProfile)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0F67AE] text-[#0F67AE] transition hover:bg-[#EEF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] sm:h-11 sm:w-11"
          aria-label="Profile"
        >
          <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}
