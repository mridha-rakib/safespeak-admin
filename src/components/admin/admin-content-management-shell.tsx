import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminContentManagementShellProps = {
  children: ReactNode;
  className?: string;
};

export function AdminContentManagementShell({ children, className }: AdminContentManagementShellProps) {
  return (
    <div className="space-y-4 rounded-[15px] border border-[#CED9E5] bg-[#FDFDFD] p-3 shadow-[0_1px_6px_rgba(0,0,0,0.25)] sm:p-4">
      <div className="rounded-[6px] bg-[#01579B] px-4 py-3">
        <h2 className="text-[22px] font-semibold leading-none text-white sm:text-[24px]">Content Management</h2>
      </div>
      <div className={cn("space-y-4", className)}>
        {children}
      </div>
    </div>
  );
}
