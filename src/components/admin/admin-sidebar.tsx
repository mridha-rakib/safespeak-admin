import type { AdminSidebarItem } from "@/components/admin/admin-nav-config";

import frameIcon from "@/assets/Frame.svg";
import { ADMIN_LOGOUT_ITEM, ADMIN_SIDEBAR_ITEMS } from "@/components/admin/admin-nav-config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

type AdminSidebarProps = {
  items?: AdminSidebarItem[];
  className?: string;
  onNavigate?: () => void;
};

function pathMatches(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function itemMatchesPath(item: AdminSidebarItem, pathname: string) {
  if (item.children?.length) {
    if (pathname === item.to) {
      return true;
    }

    return item.children.some(child => pathMatches(pathname, child.to));
  }

  return pathMatches(pathname, item.to);
}

function getGroupId(label: string) {
  return `sidebar-group-${label.toLowerCase().replace(/\s+/g, "-")}`;
}

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

function SidebarCompactBrand() {
  return (
    <div className="relative mx-auto h-12 w-12 overflow-hidden rounded-2xl border border-[#D6E2EC] bg-[#F7FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <span className="absolute left-2 top-2 text-[18px] font-extrabold leading-none tracking-tight text-[#01579B]">S</span>
      <img
        src={frameIcon}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[7px] top-[8px] h-[14px] w-[14px]"
      />
    </div>
  );
}

function SidebarOverviewCard() {
  return (
    <div className="rounded-[20px] border border-[#DFE8F0] bg-[#F7FAFC] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
      <SidebarBrand />
      <div className="mt-4 rounded-[16px] border border-[#E3EBF2] bg-white px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#607B90]">
          Admin Operations Hub
        </p>
        <p className="mt-2 text-[14px] font-semibold leading-5 text-[#154760]">
          Intelligence, compliance, crisis response, and partner routing in one workspace.
        </p>
      </div>
    </div>
  );
}

function SidebarPrimaryLink({
  item,
  isActive,
  isCollapsed,
  onNavigate,
}: {
  item: AdminSidebarItem;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem
      className={cn(
        "rounded-[20px] border p-1 transition-colors",
        isCollapsed ? "rounded-[18px] p-0" : "",
        isActive ? "border-[#D7E2ED] bg-[#F7FAFC]" : "border-transparent hover:border-[#E2EAF2] hover:bg-[#FBFDFF]",
      )}
    >
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={isActive}
        tooltip={isCollapsed ? item.label : undefined}
        className={cn(
          "h-auto min-h-[52px] rounded-[16px] px-3 py-3 text-[14px] font-semibold text-[#1F2937] hover:bg-[#EAF1F7] hover:text-[#1F2937] focus-visible:ring-[#4BA3D9] sm:px-4",
          "data-[active=true]:bg-[#01579B] data-[active=true]:text-white data-[active=true]:hover:bg-[#01579B] data-[active=true]:hover:text-white",
          isCollapsed ? "min-h-[56px] justify-center rounded-[18px] px-0 sm:px-0" : "",
        )}
      >
        <NavLink to={item.to} end={item.exact} onClick={onNavigate}>
          {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
          <span className={cn("flex-1", isCollapsed ? "sr-only" : "")}>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarExpandableLink({
  item,
  isActive,
  isOpen,
  isCollapsed,
  pathname,
  onToggle,
  onNavigate,
}: {
  item: AdminSidebarItem;
  isActive: boolean;
  isOpen: boolean;
  isCollapsed: boolean;
  pathname: string;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const groupId = getGroupId(item.label);

  return (
    <SidebarMenuItem
      className={cn(
        "rounded-[22px] border p-1 transition-colors",
        isCollapsed ? "rounded-[18px] p-0" : "",
        isActive || isOpen
          ? "border-[#D7E2ED] bg-[#F7FAFC]"
          : "border-transparent hover:border-[#E2EAF2] hover:bg-[#FBFDFF]",
      )}
    >
      <div className="relative">
        <SidebarMenuButton
          asChild
          size="lg"
          isActive={isActive}
          tooltip={isCollapsed ? item.label : undefined}
          className={cn(
            "h-auto min-h-[52px] items-start rounded-[16px] px-3 py-3 pr-12 text-[14px] font-semibold text-[#1F2937] hover:bg-[#EAF1F7] hover:text-[#1F2937] focus-visible:ring-[#4BA3D9] sm:px-4 sm:pr-14",
            "data-[active=true]:bg-[#01579B] data-[active=true]:text-white data-[active=true]:hover:bg-[#01579B] data-[active=true]:hover:text-white",
            isCollapsed ? "min-h-[56px] justify-center rounded-[18px] px-0 pr-0 sm:px-0 sm:pr-0" : "",
          )}
        >
          <NavLink to={item.to} onClick={onNavigate}>
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            <div className={cn("min-w-0 flex-1 text-left", isCollapsed ? "sr-only" : "")}>
              <span className="block whitespace-normal break-words leading-5">{item.label}</span>
            </div>
          </NavLink>
        </SidebarMenuButton>
        {!isCollapsed
          ? (
              <SidebarMenuAction
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggle();
                }}
                aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label}`}
                aria-expanded={isOpen}
                aria-controls={groupId}
                className={cn(
                  "right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-[10px] p-0 text-[#607B90] opacity-100 hover:bg-[#EAF1F7] hover:text-[#01579B] focus-visible:ring-[#4BA3D9] sm:right-3",
                  isActive ? "text-white hover:bg-white/15 hover:text-white" : "",
                )}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
              </SidebarMenuAction>
            )
          : null}
      </div>

      {isOpen && !isCollapsed
        ? (
            <SidebarMenuSub
              id={groupId}
              className="mx-1 mt-1.5 translate-x-0 gap-1 rounded-[16px] border-0 bg-white px-2 py-2 shadow-[inset_0_0_0_1px_#E6EDF4]"
            >
              {item.children?.map((child) => {
                const childIsActive = pathMatches(pathname, child.to);

                return (
                  <SidebarMenuSubItem key={child.to}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={childIsActive}
                      className={cn(
                        "h-auto min-h-10 rounded-[12px] px-3 py-2 text-[12px] font-medium text-[#375062] hover:bg-[#EAF1F7] hover:text-[#154760] focus-visible:ring-[#4BA3D9]",
                        "data-[active=true]:bg-[#0F67AE] data-[active=true]:text-white data-[active=true]:hover:bg-[#0F67AE] data-[active=true]:hover:text-white",
                      )}
                    >
                      <NavLink to={child.to} onClick={onNavigate}>
                        <span>{child.label}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          )
        : null}
    </SidebarMenuItem>
  );
}

export function AdminSidebar({ items = ADMIN_SIDEBAR_ITEMS, className, onNavigate }: AdminSidebarProps) {
  const location = useLocation();
  const { isMobile, open, toggleSidebar } = useSidebar();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    items.reduce<Record<string, boolean>>((acc, item) => {
      if (item.children?.length) {
        acc[item.to] = itemMatchesPath(item, location.pathname);
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

        if (itemMatchesPath(item, location.pathname) && !prev[item.to]) {
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

  const LogoutIcon = ADMIN_LOGOUT_ITEM.icon;
  const isCollapsed = !isMobile && !open;

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        "h-full w-full overflow-hidden rounded-[12px] border border-[#D5DEE7] bg-white text-[#111827] shadow-[0_1px_6px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <SidebarHeader className={cn("gap-4 px-4 pb-3 pt-5 sm:px-6 sm:pt-6", isCollapsed ? "px-3 sm:px-3" : "")}>
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed
            ? (
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#607B90]">
                    Admin Shell
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#154760]">SafeSpeak Operations</p>
                </div>
              )
            : null}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-10 w-10 items-center justify-center rounded-[14px] border border-[#D6E2EC] bg-[#F7FAFC] text-[#01579B] transition hover:bg-[#EAF1F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9] lg:inline-flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>
        {isCollapsed ? <SidebarCompactBrand /> : <SidebarOverviewCard />}
      </SidebarHeader>

      <SidebarSeparator className={cn("mx-4 bg-[#E1E8F0] sm:mx-6", isCollapsed ? "mx-3 sm:mx-3" : "")} />

      <SidebarContent className="pb-2">
        <SidebarGroup className={cn("px-4 pb-4 pt-3 sm:px-6", isCollapsed ? "px-3 sm:px-3" : "")}>
          {!isCollapsed
            ? (
                <SidebarGroupLabel className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#607B90]">
                  Platform Navigation
                </SidebarGroupLabel>
              )
            : null}
          <SidebarMenu className="mt-3 gap-2">
            {items.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const isActive = itemMatchesPath(item, location.pathname);

              if (!hasChildren) {
                return (
                  <SidebarPrimaryLink
                    key={item.to}
                    item={item}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    onNavigate={onNavigate}
                  />
                );
              }

              return (
                <SidebarExpandableLink
                  key={item.to}
                  item={item}
                  isActive={isActive}
                  isOpen={Boolean(openGroups[item.to])}
                  isCollapsed={isCollapsed}
                  pathname={location.pathname}
                  onToggle={() => {
                    setOpenGroups(prev => ({
                      ...prev,
                      [item.to]: !prev[item.to],
                    }));
                  }}
                  onNavigate={onNavigate}
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("gap-3 px-4 pb-5 pt-0 sm:px-6 sm:pb-6", isCollapsed ? "px-3 sm:px-3" : "")}>
        <SidebarSeparator className="mx-0 bg-[#E1E8F0]" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={isCollapsed ? ADMIN_LOGOUT_ITEM.label : undefined}
              className={cn(
                "h-auto min-h-[50px] rounded-[16px] px-3 py-3 text-[14px] font-semibold text-[#EF4444] hover:bg-[#FFF1F2] hover:text-[#EF4444] focus-visible:ring-[#4BA3D9] sm:px-4",
                isCollapsed ? "min-h-[56px] justify-center rounded-[18px] px-0 sm:px-0" : "",
              )}
            >
              <NavLink to={ADMIN_LOGOUT_ITEM.to} onClick={onNavigate}>
                {LogoutIcon ? <LogoutIcon className="h-4 w-4" aria-hidden="true" /> : null}
                <span className={cn(isCollapsed ? "sr-only" : "")}>{ADMIN_LOGOUT_ITEM.label}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
