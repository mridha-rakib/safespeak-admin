import { Outlet } from "react-router-dom";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";

export function AdminLayout() {
  return (
    <div className="min-h-dvh bg-[#D7E1EB] p-2.5">
      <div className="mx-auto w-full max-w-[1440px] rounded-xl border border-[#C7D4E1] bg-[#E7EFF7] p-4 sm:p-6">
        <div className="flex flex-col items-start gap-5 xl:flex-row">
          <AdminSidebar />
          <section className="w-full max-w-[1026px] flex-1 space-y-5">
            <AdminTopBar />
            <div className="min-h-[903px] rounded-xl border border-[#D1DDE9] bg-[#EAF1F7] p-4 sm:p-6">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
