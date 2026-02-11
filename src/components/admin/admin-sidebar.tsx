import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import frameIcon from "@/assets/Frame.svg";
import { ADMIN_LOGOUT_ITEM, ADMIN_SIDEBAR_ITEMS, type AdminSidebarItem } from "@/components/admin/admin-nav-config";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { APP_ROUTE_PATHS } from "@/routes/paths";

type AdminSidebarProps = {
  items?: AdminSidebarItem[];
  className?: string;
};

function SidebarBrand() {
  return (
    <div className="relative mx-auto h-[111px] w-[114px] leading-none">
      <div className="absolute left-0 top-1.5">
        <p className="text-[40px] font-extrabold tracking-tight text-[#01579B]">Safe</p>
        <p className="-mt-1 text-[40px] font-extrabold tracking-tight text-[#01579B]">Speak</p>
      </div>
      <img
        src={frameIcon}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-[64px] top-[-4px] h-[44px] w-[44px]"
      />
    </div>
  );
}

function SidebarLink({
  item,
  hasChildren,
}: {
  item: AdminSidebarItem;
  hasChildren: boolean;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={({ isActive }) =>
        cn(
          "flex min-h-12 items-center justify-between rounded-md px-4 text-[16px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]",
          item.tone === "danger"
            ? "text-[#EF4444] hover:bg-red-50"
            : "text-[#1F2937] hover:bg-[#EAF1F7]",
          isActive && item.tone !== "danger" ? "bg-[#01579B] text-white" : "",
          hasChildren ? "font-semibold" : "",
        )
      }
    >
      <span>{item.label}</span>
      {item.showChevron ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : null}
    </NavLink>
  );
}

export function AdminSidebar({ items = ADMIN_SIDEBAR_ITEMS, className }: AdminSidebarProps) {
  const location = useLocation();
  const isInsightsRoute = location.pathname.startsWith(APP_ROUTE_PATHS.adminInsights);

  return (
    <aside className={cn("w-full max-w-[326px] shrink-0", className)}>
      <Card className="flex h-full min-h-[903px] flex-col rounded-xl border border-[#D5DEE7] bg-white px-[22px] py-[34px] text-[#111827] shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
        <SidebarBrand />
        <nav className="mt-8 flex flex-col gap-1.5" aria-label="Admin">
          {items.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const showChildren = hasChildren && isInsightsRoute && item.to === APP_ROUTE_PATHS.adminInsights;

            return (
              <div key={item.to} className="space-y-1.5">
                <SidebarLink item={item} hasChildren={hasChildren} />
                {showChildren
                  ? (
                      <div className="space-y-1 pl-4">
                        {item.children?.map(child => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className={({ isActive }) =>
                              cn(
                                "block rounded-md px-3 py-1.5 text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#EAF1F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]",
                                isActive ? "bg-[#0F67AE] text-white hover:bg-[#0F67AE]" : "",
                              )
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )
                  : null}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto pt-8">
          <SidebarLink item={ADMIN_LOGOUT_ITEM} hasChildren={false} />
        </div>
      </Card>
    </aside>
  );
}
