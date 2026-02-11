import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { APP_ROUTE_PATHS } from "@/routes/paths";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] p-6">
      <Card className="w-full max-w-[420px] border-transparent p-2 shadow-none">
        <CardHeader className="pb-2">
          <h1 className="text-3xl font-bold">Page not found</h1>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-white/90">The page you requested does not exist.</p>
          <Button asChild className="w-full bg-[#FF8F00] hover:bg-[#F57C00]">
            <Link to={APP_ROUTE_PATHS.login}>Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
