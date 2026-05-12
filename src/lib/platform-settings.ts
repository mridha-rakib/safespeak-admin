import { adminApiRequest } from "@/lib/admin-auth";

export type PlatformSettingsPayload = {
  safety: {
    immediateDangerText: string;
    respectSupportText: string;
    platformRoleText: string;
    informationOnlyText: string;
    emergencyCallLabel: string;
    respectCallLabel: string;
    quickExitLabel: string;
    covertModeLabel: string;
  };
  consent: {
    introText: string;
    localStorageLabel: string;
    cloudSyncLabel: string;
    agencySharingLabel: string;
    analyticsLabel: string;
  };
  ai: {
    disclaimerText: string;
    humanReviewText: string;
    triageSystemPrompt: string;
    triageResponseTemplate: string;
    triageFallbackText: string;
    triageTemplateStatus: "draft" | "approved";
  };
};

export type AdminPlatformSettings = {
  draft: PlatformSettingsPayload;
  published: PlatformSettingsPayload;
  version: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminPlatformSettings(): Promise<AdminPlatformSettings> {
  const response = await adminApiRequest<{
    platformSettings: AdminPlatformSettings;
  }>("/admin/platform-settings");

  return response.data.platformSettings;
}

export async function updatePlatformSettingsDraft(
  input: PlatformSettingsPayload,
): Promise<AdminPlatformSettings> {
  const response = await adminApiRequest<{
    platformSettings: AdminPlatformSettings;
  }>("/admin/platform-settings/draft", {
    method: "PATCH",
    body: input,
  });

  return response.data.platformSettings;
}

export async function publishPlatformSettingsDraft(): Promise<AdminPlatformSettings> {
  const response = await adminApiRequest<{
    platformSettings: AdminPlatformSettings;
  }>("/admin/platform-settings/publish", {
    method: "POST",
  });

  return response.data.platformSettings;
}
