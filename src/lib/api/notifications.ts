/**
 * Notifications — /api/v1/notifications
 */

import { apiFetch } from "@/lib/api/http";

export type NotificationResponse = {
  id: string;
  notification_type: string;
  title: string;
  body: string | null;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(opts?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<{
  items: NotificationResponse[];
  total: number;
  unread_count: number;
}> {
  return apiFetch("/api/v1/notifications", {
    query: {
      unread_only: opts?.unreadOnly ?? false,
      limit: opts?.limit ?? 30,
    },
    fallbackError: "Impossible de charger les notifications",
  });
}

export async function getUnreadCount(): Promise<number> {
  try {
    const data = await apiFetch<{ unread_count: number }>(
      "/api/v1/notifications/unread-count",
    );
    return data.unread_count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}/read`, {
    method: "POST",
    body: {},
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/v1/notifications/read-all", {
    method: "POST",
    body: {},
  });
}
