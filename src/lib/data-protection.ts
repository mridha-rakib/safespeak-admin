import type { AdminOperationsSectionConfig } from "@/components/admin/admin-operations-section-page";
import { adminApiRequest } from "@/lib/admin-auth";

export async function getDataProtectionOverview(): Promise<AdminOperationsSectionConfig> {
  const response = await adminApiRequest<{ dataProtection: AdminOperationsSectionConfig }>(
    "/admin/data-protection/overview",
  );

  return response.data.dataProtection;
}
