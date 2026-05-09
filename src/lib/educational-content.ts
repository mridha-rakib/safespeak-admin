import { adminApiRequest } from "@/lib/admin-auth";
import type { AdminOperationsSectionConfig } from "@/components/admin/admin-operations-section-page";

export async function getEducationalContentOverview(): Promise<AdminOperationsSectionConfig> {
  const response = await adminApiRequest<{ educationalContent: AdminOperationsSectionConfig }>(
    "/admin/educational-content",
  );

  return response.data.educationalContent;
}
