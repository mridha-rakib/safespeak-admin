import { adminApiRequest } from "@/lib/admin-auth";

export type AdminFeedbackStatus = "new" | "in_review" | "resolved" | "dismissed";
export type AdminFeedbackSource =
  | "user_feedback"
  | "support_follow_up"
  | "impact_survey"
  | "admin_created";

export type AdminFeedbackRecord = {
  _id?: string;
  id?: string;
  userId?: string;
  sessionId?: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  subject?: string;
  message: string;
  rating?: number;
  source: AdminFeedbackSource;
  status: AdminFeedbackStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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

export async function listAdminFeedback(query: {
  status?: AdminFeedbackStatus;
  source?: AdminFeedbackSource;
  search?: string;
  limit?: number;
} = {}): Promise<AdminFeedbackRecord[]> {
  const response = await adminApiRequest<{ feedback: AdminFeedbackRecord[] }>(
    `/admin/feedback${toQueryString(query)}`,
  );

  return response.data.feedback;
}

export async function patchAdminFeedback(
  id: string,
  input: { status?: AdminFeedbackStatus; adminNotes?: string },
): Promise<AdminFeedbackRecord> {
  const response = await adminApiRequest<{ feedback: AdminFeedbackRecord }>(`/admin/feedback/${id}`, {
    method: "PATCH",
    body: input,
  });

  return response.data.feedback;
}
