import { adminApiRequest } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";

export type MediaAssetStatus = "draft" | "published" | "archived";

export type MediaAssetItem = {
  id: string;
  title: string;
  subtitle: string;
  bodyText: string;
  category: string;
  status: MediaAssetStatus;
  createdDate?: string;
  expirationDate?: string;
  offlineCachingEnabled: boolean;
  primaryCta?: string;
  secondaryButton?: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  imagePath: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaAssetFormInput = {
  title: string;
  subtitle: string;
  bodyText: string;
  category: string;
  status?: MediaAssetStatus;
  createdDate?: string;
  expirationDate?: string;
  offlineCachingEnabled?: boolean;
  primaryCta?: string;
  secondaryButton?: string;
  file?: File | null;
};

function createMediaAssetFormData(input: MediaAssetFormInput): FormData {
  const formData = new FormData();

  formData.append("title", input.title);
  formData.append("subtitle", input.subtitle);
  formData.append("bodyText", input.bodyText);
  formData.append("category", input.category);
  formData.append("offlineCachingEnabled", String(input.offlineCachingEnabled ?? false));

  if (input.createdDate) {
    formData.append("createdDate", input.createdDate);
  }

  if (input.expirationDate) {
    formData.append("expirationDate", input.expirationDate);
  }

  if (input.primaryCta) {
    formData.append("primaryCta", input.primaryCta);
  }

  if (input.secondaryButton) {
    formData.append("secondaryButton", input.secondaryButton);
  }

  if (input.status) {
    formData.append("status", input.status);
  }

  if (input.file) {
    formData.append("file", input.file);
  }

  return formData;
}

export async function listAdminMediaAssets(): Promise<MediaAssetItem[]> {
  const response = await adminApiRequest<{ assets: MediaAssetItem[] }>("/admin/media-assets");

  return response.data.assets;
}

export async function createMediaAsset(input: MediaAssetFormInput): Promise<MediaAssetItem> {
  const response = await adminApiRequest<{ asset: MediaAssetItem }>("/admin/media-assets", {
    method: "POST",
    body: createMediaAssetFormData(input),
  });

  return response.data.asset;
}

export async function updateMediaAsset(
  id: string,
  input: MediaAssetFormInput,
): Promise<MediaAssetItem> {
  const body = input.file
    ? createMediaAssetFormData(input)
    : {
        title: input.title,
        subtitle: input.subtitle,
        bodyText: input.bodyText,
        category: input.category,
        status: input.status,
        createdDate: input.createdDate,
        expirationDate: input.expirationDate,
        offlineCachingEnabled: input.offlineCachingEnabled,
        primaryCta: input.primaryCta,
        secondaryButton: input.secondaryButton,
      };

  const response = await adminApiRequest<{ asset: MediaAssetItem }>(`/admin/media-assets/${id}`, {
    method: "PATCH",
    body,
  });

  return response.data.asset;
}

export function getMediaAssetImageUrl(asset: Pick<MediaAssetItem, "imagePath">): string {
  return `${getApiBaseUrl()}${asset.imagePath}`;
}
