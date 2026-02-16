import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function AdminLayout() {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-[#D7E1EB] p-2 sm:p-3 md:p-4 lg:p-5">
      <div className="mx-auto w-full max-w-[1440px] rounded-xl border border-[#C7D4E1] bg-[#E7EFF7] p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 2xl:max-w-[1536px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
          <AdminSidebar className="hidden lg:block" />
          <section className="w-full min-w-0 flex-1 space-y-3 sm:space-y-4 lg:max-w-[1026px] lg:space-y-5">
            <AdminTopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />
            <div className="admin-panel-min-h rounded-xl border border-[#D1DDE9] bg-[#EAF1F7] p-3 sm:p-4 md:p-5 lg:p-6">
              <Outlet />
            </div>
          </section>
        </div>
      </div>

      {isMobileSidebarOpen
        ? (
            <div
              role="presentation"
              className="fixed inset-0 z-50 bg-[#0F2438]/45 backdrop-blur-[1px] lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <div
                className="h-full w-[min(86vw,360px)] p-2 sm:p-3"
                onClick={event => event.stopPropagation()}
              >
                <AdminSidebar className="h-full max-w-none" onNavigate={() => setIsMobileSidebarOpen(false)} />
              </div>
            </div>
          )
        : null}
    </div>
  );
}
