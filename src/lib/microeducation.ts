import { adminApiRequest } from "@/lib/admin-auth";

export type MicroEducationStatus = "draft" | "published";
export type MicroEducationTone = "blue" | "orange" | "green" | "amber" | "violet" | "teal";
export type MicroEducationChip = "harassment" | "rights" | "safety" | "mentalHealth";
export type MicroEducationDuration = "quick" | "deep";
export type MicroEducationFormat = "video" | "interactive" | "guide";

export type MicroEducationItem = {
  id: string;
  title: string;
  summary: string;
  tag: string;
  cta: string;
  tone: MicroEducationTone;
  chips: MicroEducationChip[];
  duration: MicroEducationDuration;
  format: MicroEducationFormat;
  status: MicroEducationStatus;
  sortOrder: number;
  views: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MicroEducationInput = {
  title: string;
  summary: string;
  tag: string;
  cta: string;
  tone: MicroEducationTone;
  chips: MicroEducationChip[];
  duration: MicroEducationDuration;
  format: MicroEducationFormat;
  status: MicroEducationStatus;
  sortOrder: number;
  views?: number;
};

export async function listAdminMicroEducation(): Promise<MicroEducationItem[]> {
  const response = await adminApiRequest<{ items: MicroEducationItem[] }>("/admin/microeducation");

  return response.data.items;
}

export async function createMicroEducationItem(input: MicroEducationInput): Promise<MicroEducationItem> {
  const response = await adminApiRequest<{ item: MicroEducationItem }>("/admin/microeducation", {
    method: "POST",
    body: input,
  });

  return response.data.item;
}

export async function updateMicroEducationItem(
  id: string,
  input: Partial<MicroEducationInput>,
): Promise<MicroEducationItem> {
  const response = await adminApiRequest<{ item: MicroEducationItem }>(`/admin/microeducation/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.item;
}

export async function deleteMicroEducationItem(id: string): Promise<void> {
  await adminApiRequest<null>(`/admin/microeducation/${id}`, {
    method: "DELETE",
  });
}
