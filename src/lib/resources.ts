import { adminApiRequest } from "@/lib/admin-auth";

export type ResourceStatus = "draft" | "published";

export type ResourceItem = {
  id: string;
  name: string;
  category: string;
  region: string;
  contact: string;
  status: ResourceStatus;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ResourceInput = {
  name: string;
  category: string;
  region: string;
  contact: string;
  status: ResourceStatus;
  sortOrder: number;
};

export async function listAdminResources(): Promise<ResourceItem[]> {
  const response = await adminApiRequest<{ resources: ResourceItem[] }>("/admin/resources");

  return response.data.resources;
}

export async function createResourceItem(input: ResourceInput): Promise<ResourceItem> {
  const response = await adminApiRequest<{ resource: ResourceItem }>("/admin/resources", {
    method: "POST",
    body: input,
  });

  return response.data.resource;
}

export async function updateResourceItem(
  id: string,
  input: Partial<ResourceInput>,
): Promise<ResourceItem> {
  const response = await adminApiRequest<{ resource: ResourceItem }>(`/admin/resources/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.resource;
}

export async function deleteResourceItem(id: string): Promise<void> {
  await adminApiRequest<null>(`/admin/resources/${id}`, {
    method: "DELETE",
  });
}
