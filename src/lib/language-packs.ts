import type { AdminOperationsSectionConfig } from "@/components/admin/admin-operations-section-page";
import { adminApiRequest } from "@/lib/admin-auth";

export async function getLanguagePacksOverview(): Promise<AdminOperationsSectionConfig> {
  const response = await adminApiRequest<{ languagePacks: AdminOperationsSectionConfig }>(
    "/admin/language-packs/overview",
  );

  return response.data.languagePacks;
}
