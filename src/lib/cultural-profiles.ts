import type { AdminOperationsSectionConfig } from "@/components/admin/admin-operations-section-page";
import { adminApiRequest } from "@/lib/admin-auth";

export type AdminCulturalProfileType = "cultural" | "faith" | "community";
export type AdminCulturalProfileStatus =
  | "draft"
  | "pending_review"
  | "validated"
  | "needs_update"
  | "archived";

export type AdminCulturalProfileRecord = {
  _id: string;
  key: string;
  name: string;
  communityType: AdminCulturalProfileType;
  languages: string[];
  faithPathway?: string;
  responseGuidance: string;
  referralPreferences: string[];
  contentGuidance: string[];
  validationStatus: AdminCulturalProfileStatus;
  reviewCadence: string;
  partnerReviewRequired: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCulturalProfilePayload = Omit<
  AdminCulturalProfileRecord,
  "_id" | "createdAt" | "updatedAt" | "reviewedAt" | "reviewedBy"
>;

type ListQuery = {
  communityType?: AdminCulturalProfileType;
  validationStatus?: AdminCulturalProfileStatus;
  isActive?: boolean;
  search?: string;
  limit?: number;
};

function toQueryString(query: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getCulturalProfilesOverview(): Promise<AdminOperationsSectionConfig> {
  const response = await adminApiRequest<{ culturalProfiles: AdminOperationsSectionConfig }>(
    "/admin/cultural-profiles/overview",
  );

  return response.data.culturalProfiles;
}

export async function listAdminCulturalProfiles(
  query: ListQuery = {},
): Promise<AdminCulturalProfileRecord[]> {
  const response = await adminApiRequest<{ culturalProfiles: AdminCulturalProfileRecord[] }>(
    `/admin/cultural-profiles${toQueryString(query)}`,
  );

  return response.data.culturalProfiles;
}

export async function createAdminCulturalProfile(
  input: AdminCulturalProfilePayload,
): Promise<AdminCulturalProfileRecord> {
  const response = await adminApiRequest<{ culturalProfile: AdminCulturalProfileRecord }>(
    "/admin/cultural-profiles",
    {
      method: "POST",
      body: input,
    },
  );

  return response.data.culturalProfile;
}

export async function patchAdminCulturalProfile(
  id: string,
  input: Partial<AdminCulturalProfilePayload>,
): Promise<AdminCulturalProfileRecord> {
  const response = await adminApiRequest<{ culturalProfile: AdminCulturalProfileRecord }>(
    `/admin/cultural-profiles/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.culturalProfile;
}

export async function deleteAdminCulturalProfile(id: string): Promise<void> {
  await adminApiRequest<{ culturalProfile: AdminCulturalProfileRecord }>(
    `/admin/cultural-profiles/${id}`,
    {
      method: "DELETE",
    },
  );
}
