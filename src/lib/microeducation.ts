import { adminApiRequest } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api";

export type MicroEducationStatus = "draft" | "published";
export type MicroEducationCategoryStatus = "draft" | "published";
export type MicroEducationTone = "blue" | "orange" | "green" | "amber" | "violet" | "teal";
export type MicroEducationChip = "harassment" | "rights" | "safety" | "mentalHealth";
export type MicroEducationDuration = "quick" | "deep";
export type MicroEducationFormat = "video" | "interactive" | "guide";

export type MicroEducationItem = {
  id: string;
  title: string;
  summary: string;
  readTimeLabel: string;
  tag: string;
  cta: string;
  detailHeading: string;
  detailSummary?: string;
  detailBody: string;
  detailTakeaway: string;
  imageAlt?: string;
  categoryId?: string;
  category?: MicroEducationCategory;
  tone: MicroEducationTone;
  chips: MicroEducationChip[];
  duration: MicroEducationDuration;
  format: MicroEducationFormat;
  status: MicroEducationStatus;
  sortOrder: number;
  views: number;
  imageOriginalFileName?: string;
  imageMimeType?: string;
  imageSizeBytes?: number;
  imagePath?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MicroEducationCategory = {
  id: string;
  name: string;
  description?: string;
  backgroundColor: string;
  textColor: string;
  iconName?: string;
  imageUrl?: string;
  status: MicroEducationCategoryStatus;
  sortOrder: number;
  cardCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MicroEducationCategoryInput = {
  name: string;
  description?: string;
  backgroundColor: string;
  textColor: string;
  iconName?: string;
  imageUrl?: string;
  status: MicroEducationCategoryStatus;
  sortOrder: number;
};

export type MicroEducationInput = {
  title: string;
  summary: string;
  readTimeLabel: string;
  tag: string;
  cta: string;
  detailHeading: string;
  detailSummary?: string;
  detailBody: string;
  detailTakeaway: string;
  imageAlt?: string;
  categoryId?: string;
  tone: MicroEducationTone;
  chips: MicroEducationChip[];
  duration: MicroEducationDuration;
  format: MicroEducationFormat;
  status: MicroEducationStatus;
  sortOrder: number;
  views?: number;
  imageFile?: File | null;
};

function createMicroEducationFormData(input: MicroEducationInput | Partial<MicroEducationInput>): FormData {
  const formData = new FormData();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || key === "imageFile") {
      return;
    }

    if (key === "chips" && Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  if (input.imageFile) {
    formData.append("image", input.imageFile);
  }

  return formData;
}

export async function listAdminMicroEducation(): Promise<MicroEducationItem[]> {
  const response = await adminApiRequest<{ items: MicroEducationItem[] }>("/admin/microeducation");

  return response.data.items;
}

export async function listAdminMicroEducationCategories(): Promise<MicroEducationCategory[]> {
  const response = await adminApiRequest<{ categories: MicroEducationCategory[] }>(
    "/admin/microeducation/categories",
  );

  return response.data.categories;
}

export async function createMicroEducationCategory(
  input: MicroEducationCategoryInput,
): Promise<MicroEducationCategory> {
  const response = await adminApiRequest<{ category: MicroEducationCategory }>(
    "/admin/microeducation/categories",
    {
      method: "POST",
      body: input,
    },
  );

  return response.data.category;
}

export async function updateMicroEducationCategory(
  id: string,
  input: Partial<MicroEducationCategoryInput>,
): Promise<MicroEducationCategory> {
  const response = await adminApiRequest<{ category: MicroEducationCategory }>(
    `/admin/microeducation/categories/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.category;
}

export async function deleteMicroEducationCategory(id: string): Promise<void> {
  await adminApiRequest<null>(`/admin/microeducation/categories/${id}`, {
    method: "DELETE",
  });
}

export async function createMicroEducationItem(input: MicroEducationInput): Promise<MicroEducationItem> {
  const response = await adminApiRequest<{ item: MicroEducationItem }>("/admin/microeducation", {
    method: "POST",
    body: input.imageFile ? createMicroEducationFormData(input) : input,
  });

  return response.data.item;
}

export async function updateMicroEducationItem(
  id: string,
  input: Partial<MicroEducationInput>,
): Promise<MicroEducationItem> {
  const response = await adminApiRequest<{ item: MicroEducationItem }>(`/admin/microeducation/${id}`, {
    method: "PATCH",
    body: input.imageFile ? createMicroEducationFormData(input) : input,
  });

  return response.data.item;
}

export async function deleteMicroEducationItem(id: string): Promise<void> {
  await adminApiRequest<null>(`/admin/microeducation/${id}`, {
    method: "DELETE",
  });
}

export function getMicroEducationImageUrl(item: Pick<MicroEducationItem, "imagePath">): string | undefined {
  if (!item.imagePath) {
    return undefined;
  }

  return /^https?:\/\//i.test(item.imagePath) ? item.imagePath : `${getApiBaseUrl()}${item.imagePath}`;
}
