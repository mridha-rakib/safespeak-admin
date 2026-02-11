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
        className="pointer-events-none absolute left-[69.5px] top-[9px] h-[28px] w-[29px]"
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
        )}
    >
      <span>{item.label}</span>
      {item.showChevron ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : null}
    </NavLink>
  );
}

export function AdminSidebar({ items = ADMIN_SIDEBAR_ITEMS, className }: AdminSidebarProps) {
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
    <aside className={cn("w-full max-w-[326px] shrink-0", className)}>
      <Card className="flex h-full min-h-[903px] flex-col gap-10 rounded-[12px] border border-[#D5DEE7] bg-white px-[34px] pb-[64px] pt-[64px] text-[#111827] shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
        <SidebarBrand />
        <nav className="flex flex-col gap-1.5" aria-label="Admin">
          {items.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isGroupActive = hasChildren && location.pathname === item.to;
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
                          "flex min-h-12 w-full items-center justify-between rounded-md px-4 text-[16px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]",
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
                      <SidebarLink item={item} hasChildren={false} />
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
                            className={({ isActive }) =>
                              cn(
                                "block rounded-md px-3 py-1.5 text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#EAF1F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]",
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
          <SidebarLink item={ADMIN_LOGOUT_ITEM} hasChildren={false} />
        </div>
      </Card>
    </aside>
  );
}
