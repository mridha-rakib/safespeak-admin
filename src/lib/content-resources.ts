import { adminApiRequest } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";

export type ContentResourceStatus = "draft" | "published" | "archived";

export type ContentResourceItem = {
  id: string;
  name: string;
  language: string;
  category: string;
  jurisdiction: string;
  reviewDate?: string;
  status: ContentResourceStatus;
  displayStatus: "Draft" | "Archived" | "Active" | "Expiring Soon" | "Outdated";
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  imageOriginalFileName?: string;
  imageMimeType?: string;
  imageSizeBytes?: number;
  imagePath?: string;
  downloadPath: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ContentResourceFormInput = {
  name: string;
  language: string;
  category: string;
  jurisdiction: string;
  reviewDate?: string;
  status?: ContentResourceStatus;
  file?: File | null;
  imageFile?: File | null;
};

function createContentResourceFormData(input: ContentResourceFormInput): FormData {
  const formData = new FormData();

  formData.append("name", input.name);
  formData.append("language", input.language);
  formData.append("category", input.category);
  formData.append("jurisdiction", input.jurisdiction);

  if (input.reviewDate) {
    formData.append("reviewDate", input.reviewDate);
  }

  if (input.status) {
    formData.append("status", input.status);
  }

  if (input.file) {
    formData.append("file", input.file);
  }

  if (input.imageFile) {
    formData.append("image", input.imageFile);
  }

  return formData;
}

export async function listAdminContentResources(): Promise<ContentResourceItem[]> {
  const response = await adminApiRequest<{ resources: ContentResourceItem[] }>("/admin/content-resources");

  return response.data.resources;
}

export async function getAdminContentResource(id: string): Promise<ContentResourceItem> {
  const response = await adminApiRequest<{ resource: ContentResourceItem }>(`/admin/content-resources/${id}`);

  return response.data.resource;
}

export async function createContentResource(input: ContentResourceFormInput): Promise<ContentResourceItem> {
  const response = await adminApiRequest<{ resource: ContentResourceItem }>("/admin/content-resources", {
    method: "POST",
    body: createContentResourceFormData(input),
  });

  return response.data.resource;
}

export async function updateContentResource(
  id: string,
  input: ContentResourceFormInput,
): Promise<ContentResourceItem> {
  const body = input.file || input.imageFile
    ? createContentResourceFormData(input)
    : {
        name: input.name,
        language: input.language,
        category: input.category,
        jurisdiction: input.jurisdiction,
        reviewDate: input.reviewDate,
        status: input.status,
      };

  const response = await adminApiRequest<{ resource: ContentResourceItem }>(`/admin/content-resources/${id}`, {
    method: "PATCH",
    body,
  });

  return response.data.resource;
}

export async function deleteContentResource(id: string): Promise<void> {
  await adminApiRequest<null>(`/admin/content-resources/${id}`, {
    method: "DELETE",
  });
}

export function getContentResourceDownloadUrl(resource: Pick<ContentResourceItem, "downloadPath">): string {
  return `${getApiBaseUrl()}${resource.downloadPath}`;
}

export function getContentResourceImageUrl(resource: Pick<ContentResourceItem, "imagePath">): string | undefined {
  return resource.imagePath ? `${getApiBaseUrl()}${resource.imagePath}` : undefined;
}
