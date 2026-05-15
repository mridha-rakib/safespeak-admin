import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const location = useLocation();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isFlushContentRoute = location.pathname.endsWith("/content-management/media-asset");

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <SidebarProvider open={isDesktopSidebarOpen} onOpenChange={setIsDesktopSidebarOpen}>
      <div className="min-h-dvh w-full min-w-0 flex-1 bg-[#E7EFF7]">
        <div className="flex min-h-dvh flex-col lg:flex-row lg:items-stretch">
          <div
            className={cn(
              "hidden shrink-0 transition-[width] duration-300 ease-out lg:block lg:h-dvh",
              isDesktopSidebarOpen ? "lg:w-[300px] xl:w-[326px]" : "lg:w-[88px]",
            )}
          >
            <div
              className={cn(
                "fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-300 ease-out lg:block",
                isDesktopSidebarOpen ? "lg:w-[300px] xl:w-[326px]" : "lg:w-[88px]",
              )}
            >
              <AdminSidebar className="h-full w-full max-w-none rounded-none border-y-0 border-l-0" />
            </div>
          </div>
          <section className="w-full min-w-0 flex-1 space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-5 lg:space-y-5 lg:p-5 xl:p-6">
            <AdminTopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />
            {isFlushContentRoute ? (
              <div className="admin-panel-min-h w-full min-w-0">
                <Outlet />
              </div>
            ) : (
              <div className="admin-panel-min-h w-full min-w-0 rounded-[18px] border border-[#D1DDE9] bg-[#EAF1F7] p-3 sm:p-4 md:p-5 lg:p-6">
                <Outlet />
              </div>
            )}
          </section>
        </div>

        {isMobileSidebarOpen
          ? (
              <div
                role="presentation"
                className="fixed inset-0 z-50 bg-[#0F2438]/45 backdrop-blur-[1px] lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <div
                  className="h-full w-[min(88vw,380px)] p-2 sm:p-3"
                  onClick={event => event.stopPropagation()}
                >
                  <AdminSidebar className="h-full w-full max-w-none" onNavigate={() => setIsMobileSidebarOpen(false)} />
                </div>
              </div>
            )
          : null}
      </div>
    </SidebarProvider>
  );
}
