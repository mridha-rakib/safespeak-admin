import type { AdminSidebarItem } from "@/components/admin/admin-nav-config";

import frameIcon from "@/assets/Frame.svg";
import { ADMIN_LOGOUT_ITEM, ADMIN_SIDEBAR_ITEMS } from "@/components/admin/admin-nav-config";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

type AdminSidebarProps = {
  items?: AdminSidebarItem[];
  className?: string;
  onNavigate?: () => void;
};

function SidebarBrand() {
  return (
    <div className="relative mx-auto h-[96px] w-[98px] leading-none sm:h-[111px] sm:w-[114px]">
      <div className="absolute left-0 top-1.5">
        <p className="text-[34px] font-extrabold tracking-tight text-[#01579B] sm:text-[40px]">Safe</p>
        <p className="-mt-1 text-[34px] font-extrabold tracking-tight text-[#01579B] sm:text-[40px]">Speak</p>
      </div>
      <img
        src={frameIcon}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-[58px] top-[8px] h-[24px] w-[25px] sm:left-[69.5px] sm:top-[9px] sm:h-[28px] sm:w-[29px]"
      />
    </div>
  );
}

function SidebarLink({
  item,
  hasChildren,
  onNavigate,
}: {
  item: AdminSidebarItem;
  hasChildren: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex min-h-11 items-center justify-between rounded-md px-3 text-[14px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] sm:min-h-12 sm:px-4 sm:text-[16px]",
          item.tone === "danger"
            ? "text-[#EF4444] hover:bg-red-50"
            : "text-[#1F2937] hover:bg-[#EAF1F7]",
          isActive && item.tone !== "danger" ? "bg-[#01579B] text-white" : "",
          hasChildren ? "font-semibold" : "",
        )}
    >
      <span>{item.label}</span>
      {item.showChevron ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : null}
    </NavLink>
  );
}

export function AdminSidebar({ items = ADMIN_SIDEBAR_ITEMS, className, onNavigate }: AdminSidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    items.reduce<Record<string, boolean>>((acc, item) => {
      if (item.children?.length) {
        acc[item.to] = location.pathname.startsWith(item.to);
      }
      return acc;
    }, {}),
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      let next = prev;
      let changed = false;

      for (const item of items) {
        if (!item.children?.length) {
          continue;
        }

        if (location.pathname.startsWith(item.to) && !prev[item.to]) {
          if (next === prev) {
            next = { ...prev };
          }
          next[item.to] = true;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [items, location.pathname]);

  return (
    <aside className={cn("w-full shrink-0 lg:max-w-[300px] xl:max-w-[326px]", className)}>
      <Card className="flex h-full min-h-0 max-h-[calc(100dvh-1rem)] flex-col gap-6 overflow-y-auto rounded-[12px] border border-[#D5DEE7] bg-white px-4 pb-6 pt-6 text-[#111827] shadow-[0_1px_6px_rgba(0,0,0,0.25)] sm:px-6 sm:pb-8 sm:pt-8 lg:max-h-none lg:gap-8 lg:px-7 lg:pb-10 lg:pt-10 xl:admin-panel-min-h xl:gap-10 xl:px-[34px] xl:pb-[64px] xl:pt-[64px]">
        <SidebarBrand />
        <nav className="flex flex-col gap-1.5" aria-label="Admin">
          {items.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isGroupActive = hasChildren && location.pathname.startsWith(item.to);
            const showChildren = hasChildren && Boolean(openGroups[item.to]);

            return (
              <div key={item.to} className="space-y-1.5">
                {hasChildren
                  ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenGroups(prev => ({
                            ...prev,
                            [item.to]: !prev[item.to],
                          }));
                        }}
                        className={cn(
                          "flex min-h-11 w-full items-center justify-between rounded-md px-3 text-[14px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] sm:min-h-12 sm:px-4 sm:text-[16px]",
                          isGroupActive
                            ? "bg-[#01579B] text-white"
                            : showChildren
                              ? "bg-[#EAF1F7] text-[#1F2937]"
                              : "text-[#1F2937] hover:bg-[#EAF1F7]",
                        )}
                        aria-expanded={showChildren}
                        aria-controls={`sidebar-group-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <span>{item.label}</span>
                        {item.showChevron
                          ? (
                              <ChevronDown
                                className={cn("h-4 w-4 transition-transform", showChildren ? "rotate-180" : "")}
                                aria-hidden="true"
                              />
                            )
                          : null}
                      </button>
                    )
                  : (
                      <SidebarLink item={item} hasChildren={false} onNavigate={onNavigate} />
                    )}
                {showChildren
                  ? (
                      <div
                        id={`sidebar-group-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                        className="space-y-1 pl-4"
                      >
                        {item.children?.map(child => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                              cn(
                                "block rounded-md px-3 py-1.5 text-[12px] font-medium text-[#1F2937] transition-colors hover:bg-[#EAF1F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] sm:text-[13px]",
                                isActive ? "bg-[#0F67AE] text-white hover:bg-[#0F67AE]" : "",
                              )}
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
        <div className="mt-auto">
          <SidebarLink item={ADMIN_LOGOUT_ITEM} hasChildren={false} onNavigate={onNavigate} />
        </div>
      </Card>
    </aside>
  );
}
