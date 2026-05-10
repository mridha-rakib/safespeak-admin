import { adminApiRequest } from "@/lib/admin-auth";

export type AdminDashboardSummary = {
  users: number;
  reports: number;
  knowledgeSources: number;
  openPrivacyRequests: number;
};

export type AdminManagedUser = {
  _id?: string;
  id?: string;
  email: string;
  fullName: string;
  role: string;
  status: "active" | "inactive" | "suspended" | "deleted";
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type AdminTaxonomyRecord = {
  _id: string;
  type: "incident_type" | "support_need" | "language" | "culture";
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
};

export type AdminDestinationRecord = {
  _id: string;
  type: "agency" | "support_service" | "webhook";
  name: string;
  endpoint?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
};

export type AdminPrivacyRequestRecord = {
  _id: string;
  requestType: string;
  status: "pending" | "in_review" | "completed" | "rejected";
  notes?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  requesterEmail?: string;
};

export type AdminAnalyticsOverview = {
  totalReports?: number;
  byStatus?: Array<{ _id: string; count: number }>;
  bySeverity?: Array<{ _id: string; count: number }>;
  privacy?: {
    anonymisedOnly?: boolean;
    minimumCellSuppression?: number;
  };
};

export type AdminAnalyticsBucket = {
  _id: Record<string, string | null> | string | null;
  count: number;
};

type AnalyticsQuery = {
  from?: string;
  to?: string;
  jurisdiction?: string;
  language?: string;
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

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const response = await adminApiRequest<{ dashboard: AdminDashboardSummary }>("/admin/dashboard");

  return response.data.dashboard;
}

export async function listAdminUsers(query: {
  role?: string;
  status?: string;
  search?: string;
  limit?: number;
} = {}): Promise<AdminManagedUser[]> {
  const response = await adminApiRequest<{ users: AdminManagedUser[] }>(
    `/admin/users${toQueryString(query)}`,
  );

  return response.data.users;
}

export async function updateAdminUser(
  id: string,
  input: Partial<Pick<AdminManagedUser, "fullName" | "role" | "status">>,
): Promise<AdminManagedUser> {
  const response = await adminApiRequest<{ user: AdminManagedUser }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.user;
}

export async function listAdminTaxonomies(query: {
  type?: AdminTaxonomyRecord["type"];
  isActive?: boolean;
} = {}): Promise<AdminTaxonomyRecord[]> {
  const response = await adminApiRequest<{ taxonomies: AdminTaxonomyRecord[] }>(
    `/admin/taxonomies${toQueryString(query)}`,
  );

  return response.data.taxonomies;
}

export async function createAdminTaxonomy(
  input: Omit<AdminTaxonomyRecord, "_id">,
): Promise<AdminTaxonomyRecord> {
  const response = await adminApiRequest<{ taxonomy: AdminTaxonomyRecord }>("/admin/taxonomies", {
    method: "POST",
    body: input,
  });

  return response.data.taxonomy;
}

export async function patchAdminTaxonomy(
  id: string,
  input: Partial<Omit<AdminTaxonomyRecord, "_id">>,
): Promise<AdminTaxonomyRecord> {
  const response = await adminApiRequest<{ taxonomy: AdminTaxonomyRecord }>(`/admin/taxonomies/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.taxonomy;
}

export async function listAdminDestinations(query: {
  type?: AdminDestinationRecord["type"];
  isActive?: boolean;
} = {}): Promise<AdminDestinationRecord[]> {
  const response = await adminApiRequest<{ destinations: AdminDestinationRecord[] }>(
    `/admin/destinations${toQueryString(query)}`,
  );

  return response.data.destinations;
}

export async function createAdminDestination(
  input: Omit<AdminDestinationRecord, "_id">,
): Promise<AdminDestinationRecord> {
  const response = await adminApiRequest<{ destination: AdminDestinationRecord }>("/admin/destinations", {
    method: "POST",
    body: input,
  });

  return response.data.destination;
}

export async function patchAdminDestination(
  id: string,
  input: Partial<Omit<AdminDestinationRecord, "_id">>,
): Promise<AdminDestinationRecord> {
  const response = await adminApiRequest<{ destination: AdminDestinationRecord }>(
    `/admin/destinations/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.destination;
}

export async function listAdminPrivacyRequests(query: {
  status?: AdminPrivacyRequestRecord["status"];
  limit?: number;
} = {}): Promise<AdminPrivacyRequestRecord[]> {
  const response = await adminApiRequest<{ privacyRequests: AdminPrivacyRequestRecord[] }>(
    `/admin/privacy-requests${toQueryString(query)}`,
  );

  return response.data.privacyRequests;
}

export async function patchAdminPrivacyRequest(
  id: string,
  input: Pick<AdminPrivacyRequestRecord, "status"> & { notes?: string },
): Promise<AdminPrivacyRequestRecord> {
  const response = await adminApiRequest<{ privacyRequest: AdminPrivacyRequestRecord }>(
    `/admin/privacy-requests/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.data.privacyRequest;
}

export async function getAdminAnalyticsOverview(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsOverview> {
  const response = await adminApiRequest<{ overview: AdminAnalyticsOverview }>(
    `/admin/analytics/overview${toQueryString(query)}`,
  );

  return response.data.overview;
}

export async function getAdminAnalyticsHeatmap(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ heatmap: AdminAnalyticsBucket[] }>(
    `/admin/analytics/heatmap${toQueryString(query)}`,
  );

  return response.data.heatmap;
}

export async function getAdminAnalyticsTrends(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ trends: AdminAnalyticsBucket[] }>(
    `/admin/analytics/trends${toQueryString(query)}`,
  );

  return response.data.trends;
}

export async function getAdminAnalyticsCategories(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ categories: AdminAnalyticsBucket[] }>(
    `/admin/analytics/categories${toQueryString(query)}`,
  );

  return response.data.categories;
}

export async function getAdminAnalyticsLanguages(
  query: AnalyticsQuery = {},
): Promise<AdminAnalyticsBucket[]> {
  const response = await adminApiRequest<{ languages: AdminAnalyticsBucket[] }>(
    `/admin/analytics/languages${toQueryString(query)}`,
  );

  return response.data.languages;
}
