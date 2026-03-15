import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function AdminLayout() {
  const location = useLocation();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <SidebarProvider open={isDesktopSidebarOpen} onOpenChange={setIsDesktopSidebarOpen}>
      <div className="min-h-dvh w-full min-w-0 flex-1 bg-[#D7E1EB] p-2 sm:p-3 md:p-4 lg:p-5">
        <div className="w-full rounded-[20px] border border-[#C7D4E1] bg-[#E7EFF7] p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
            <div
              className={cn(
                "hidden shrink-0 transition-[width] duration-300 ease-out lg:block",
                isDesktopSidebarOpen ? "lg:w-[300px] xl:w-[326px]" : "lg:w-[88px]",
              )}
            >
              <AdminSidebar className="h-full w-full max-w-none" />
            </div>
            <section className="w-full min-w-0 flex-1 space-y-3 sm:space-y-4 lg:space-y-5">
              <AdminTopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />
              <div className="admin-panel-min-h w-full min-w-0 rounded-[18px] border border-[#D1DDE9] bg-[#EAF1F7] p-3 sm:p-4 md:p-5 lg:p-6">
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
