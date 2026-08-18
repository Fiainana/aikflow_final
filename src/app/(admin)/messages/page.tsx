"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  listThreads,
  getThreadMessages,
  postMessage,
  markThreadRead,
  createThread,
  threadTypeLabel,
  type ThreadResponse,
  type MessageResponse,
  type ThreadType,
} from "@/lib/api/messaging";
import { ApiError } from "@/lib/api/http";

export default function MessagesPage() {
  const { isAuthenticated, isSuperAdmin, isLoading: authLoading, user } =
    useAuth();
  const [threads, setThreads] = useState<ThreadResponse[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<ThreadType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState<ThreadType>("ANNOUNCEMENT");

  const loadThreads = useCallback(async () => {
    setError(null);
    try {
      const data = await listThreads({
        threadType: filter === "ALL" ? null : filter,
      });
      setThreads(data.items ?? []);
      setTotalUnread(data.total_unread ?? 0);
      if (!selectedId && data.items?.[0]) {
        setSelectedId(data.items[0].id);
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Impossible de charger les conversations",
      );
      setThreads([]);
    }
  }, [filter, selectedId]);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      const data = await getThreadMessages(threadId);
      setMessages(data.items ?? []);
      await markThreadRead(threadId).catch(() => {});
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Impossible de charger les messages",
      );
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || isSuperAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await loadThreads();
      setLoading(false);
    })();
  }, [authLoading, isAuthenticated, isSuperAdmin, loadThreads]);

  useEffect(() => {
    if (selectedId && isAuthenticated && !isSuperAdmin) {
      void loadMessages(selectedId);
    }
  }, [selectedId, isAuthenticated, isSuperAdmin, loadMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await postMessage(selectedId, draft.trim());
      setDraft("");
      await loadMessages(selectedId);
      await loadThreads();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newBody.trim()) return;
    setSending(true);
    setError(null);
    try {
      const thread = await createThread({
        thread_type: newType,
        subject: newSubject.trim(),
        body: newBody.trim(),
      });
      setShowNew(false);
      setNewSubject("");
      setNewBody("");
      setSelectedId(thread.id);
      await loadThreads();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Création impossible",
      );
    } finally {
      setSending(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-25 p-8 dark:border-brand-800 dark:bg-brand-500/10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Messagerie club
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Disponible dans le contexte d’un club.
        </p>
        <Link href="/admin/clubs" className="mt-4 inline-flex text-sm font-medium text-brand-600">
          Voir les clubs →
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          Connectez-vous pour accéder à la messagerie.
        </p>
        <Link href="/signin" className="mt-4 inline-flex text-sm font-medium text-brand-600">
          Connexion
        </Link>
      </div>
    );
  }

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const meId = user?.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Communication
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Messagerie
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
                {totalUnread}
              </span>
            )}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ThreadType | "ALL")}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="ALL">Tous</option>
            <option value="ANNOUNCEMENT">Annonces</option>
            <option value="TEAM">Équipe</option>
            <option value="DIRECT">Direct</option>
          </select>
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
          >
            Nouvelle conversation
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          {error}
        </div>
      )}

      {showNew && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Nouvelle conversation
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ThreadType)}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="ANNOUNCEMENT">Annonce club</option>
              <option value="TEAM">Équipe</option>
              <option value="DIRECT">Direct</option>
            </select>
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Sujet"
              required
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Message initial…"
            required
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid min-h-[480px] grid-cols-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-gray-200 dark:border-gray-800 lg:border-b-0 lg:border-r">
          <ul className="max-h-[480px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            {threads.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-gray-500">
                Aucune conversation
              </li>
            ) : (
              threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full px-4 py-3 text-left transition ${
                      selectedId === t.id
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {t.subject}
                      </span>
                      {t.unread_count > 0 && (
                        <span className="shrink-0 rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {threadTypeLabel(t.thread_type)}
                      {t.last_message_preview
                        ? ` · ${t.last_message_preview.slice(0, 40)}`
                        : ""}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <section className="flex flex-col">
          {selected ? (
            <>
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selected.subject}
                </h2>
                <p className="text-xs text-gray-500">
                  {threadTypeLabel(selected.thread_type)} ·{" "}
                  {selected.messages_count} message
                  {selected.messages_count > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => {
                  const mine = m.author?.id === meId;
                  const name = m.author
                    ? `${m.author.first_name ?? ""} ${m.author.last_name ?? ""}`.trim()
                    : "Système";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          mine
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[11px] font-medium opacity-80">
                            {name || "Membre"}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? "text-white/70" : "text-gray-400"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.is_edited ? " · modifié" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={handleSend}
                className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Écrire un message…"
                  className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Envoyer
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
              Sélectionnez une conversation
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
