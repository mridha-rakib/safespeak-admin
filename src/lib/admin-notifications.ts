import { adminApiRequest } from "@/lib/admin-auth";

export type AdminNotificationCategory = "security" | "account" | "usage" | "system";
export type AdminNotificationTone = "critical" | "warning" | "info";
export type AdminNotificationChannel = "In-app" | "Email" | "Push";

export type AdminNotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  dateLabel: string;
  category: AdminNotificationCategory;
  unread: boolean;
  tone: AdminNotificationTone;
  channel: AdminNotificationChannel;
  createdAt?: string;
  sourceType?: string;
  sourceId?: string;
};

type AdminNotificationsResponse = {
  notifications: AdminNotificationItem[];
};

export async function listAdminNotifications(): Promise<AdminNotificationItem[]> {
  const response = await adminApiRequest<AdminNotificationsResponse>("/admin/notifications");

  return response.data.notifications;
}

export async function markAdminNotificationRead(notificationId: string): Promise<void> {
  await adminApiRequest("/admin/notifications/read", {
    method: "POST",
    body: { notificationId },
  });
}

export async function markAdminNotificationsRead(notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) {
    return;
  }

  await adminApiRequest("/admin/notifications/read-all", {
    method: "POST",
    body: { notificationIds },
  });
}
