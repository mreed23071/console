import { Loader2, Lock, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/features/auth";
import { useCreatePersonNote, useDeletePersonNote } from "@/features/people/api/mutations";
import { usePersonNotes } from "@/features/people/api/queries";

/** Admin-only. The caller is responsible for gating this on the scope. */
export function PersonNotesCard({ personId }: { personId: string }) {
  const { t } = useTranslation("people");
  const authorName = useAuthStore((s) => s.session?.name ?? "Admin");
  const notes = usePersonNotes(personId);
  const createNote = useCreatePersonNote(personId);
  const deleteNote = useDeletePersonNote(personId);
  const [body, setBody] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="size-4 text-muted-foreground" /> {t("notes.title")}
        </CardTitle>
        <CardDescription>{t("notes.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("notes.placeholder")}
            rows={3}
          />
          <Button
            size="sm"
            disabled={!body.trim() || createNote.isPending}
            onClick={() =>
              createNote.mutate(
                { body: body.trim(), author: authorName },
                {
                  onSuccess: () => {
                    setBody("");
                    toast.success(t("notes.addSuccess"));
                  },
                  onError: () => toast.error(t("notes.addError")),
                },
              )
            }
          >
            {createNote.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
            {t("notes.add")}
          </Button>
        </div>

        <Separator />

        {notes.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (notes.data ?? []).length === 0 ? (
          <EmptyState title={t("notes.emptyTitle")} description={t("notes.emptyDescription")} />
        ) : (
          notes.data!.map((n) => (
            <div key={n.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium">{n.author}</span>
                <span className="tnum text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-destructive"
                  aria-label={t("notes.title")}
                  onClick={() => deleteNote.mutate(n.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="text-sm">{n.body}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
