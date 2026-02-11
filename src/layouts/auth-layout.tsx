import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F9FAFB] p-4 sm:p-6">
      <Outlet />
    </main>
  );
}
