import type { AdminOperationsSectionConfig } from "@/components/admin/admin-operations-section-page";
import { adminApiRequest } from "@/lib/admin-auth";

export async function getIntelligenceCenterOverview(): Promise<AdminOperationsSectionConfig> {
  const response = await adminApiRequest<{ intelligenceCenter: AdminOperationsSectionConfig }>(
    "/admin/insights/incident-insights/overview",
  );

  return response.data.intelligenceCenter;
}
