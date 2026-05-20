import type { AdminOperationsSectionConfig } from "@/components/admin/admin-operations-section-page";
import { adminApiRequest } from "@/lib/admin-auth";

export async function getAiEngineOverview(): Promise<AdminOperationsSectionConfig> {
  const response = await adminApiRequest<{ aiEngine: AdminOperationsSectionConfig }>(
    "/admin/ai-engine/overview",
  );

  return response.data.aiEngine;
}
