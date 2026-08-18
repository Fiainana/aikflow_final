/**
 * Messagerie — /api/v1/messaging
 */

import { apiFetch } from "@/lib/api/http";

export type ThreadType = "ANNOUNCEMENT" | "TEAM" | "DIRECT";
export type ThreadPriority = "NORMAL" | "HIGH" | "URGENT";

export type ThreadResponse = {
  id: string;
  organization_id: string;
  thread_type: ThreadType;
  team_id: string | null;
  subject: string;
  priority: ThreadPriority;
  is_pinned: boolean;
  is_closed: boolean;
  is_muted: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  messages_count: number;
  unread_count: number;
  participants_count: number;
};

export type MessageResponse = {
  id: string;
  thread_id: string;
  author: {
    id: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  body: string;
  is_edited: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listThreads(opts?: {
  threadType?: ThreadType | null;
  teamId?: string | null;
  q?: string | null;
}): Promise<{ items: ThreadResponse[]; total: number; total_unread: number }> {
  return apiFetch("/api/v1/messaging/threads", {
    query: {
      thread_type: opts?.threadType ?? undefined,
      team_id: opts?.teamId ?? undefined,
      q: opts?.q ?? undefined,
    },
    fallbackError: "Impossible de charger les conversations",
  });
}

export async function getThreadMessages(
  threadId: string,
): Promise<{ items: MessageResponse[]; total: number; thread_id: string }> {
  return apiFetch(`/api/v1/messaging/threads/${threadId}/messages`, {
    fallbackError: "Impossible de charger les messages",
  });
}

export async function createThread(body: {
  thread_type: ThreadType;
  subject: string;
  body: string;
  team_id?: string | null;
  participant_user_ids?: string[] | null;
  priority?: ThreadPriority;
}): Promise<ThreadResponse> {
  return apiFetch("/api/v1/messaging/threads", {
    method: "POST",
    body,
    fallbackError: "Création de conversation impossible",
  });
}

export async function postMessage(
  threadId: string,
  body: string,
): Promise<MessageResponse> {
  return apiFetch(`/api/v1/messaging/threads/${threadId}/messages`, {
    method: "POST",
    body: { body },
    fallbackError: "Envoi impossible",
  });
}

export async function markThreadRead(threadId: string): Promise<void> {
  await apiFetch(`/api/v1/messaging/threads/${threadId}/read`, {
    method: "POST",
    body: {},
  });
}

export function threadTypeLabel(t: ThreadType): string {
  const map: Record<ThreadType, string> = {
    ANNOUNCEMENT: "Annonce",
    TEAM: "Équipe",
    DIRECT: "Direct",
  };
  return map[t] ?? t;
}
