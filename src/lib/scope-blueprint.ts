import { adminApiRequest } from "@/lib/admin-auth";

type ScopeBlueprintResponse = {
  blueprint: Record<string, unknown>;
};

export async function getScopeBlueprint() {
  const response = await adminApiRequest<ScopeBlueprintResponse>("/scope/blueprint");

  return response.data.blueprint;
}
