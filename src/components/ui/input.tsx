import { cn } from "@/lib/utils";
import * as React from "react";

function Input({ ref, className, type, ...props }: React.ComponentPropsWithRef<"input">) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-transparent bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4BA3D9]",
        className,
      )}
      {...props}
    />
  );
}

Input.displayName = "Input";

export { Input };
