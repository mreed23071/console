import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useForgetPerson } from "@/features/people/api/mutations";

/** Right-to-be-forgotten action. Destructive and irreversible, so it confirms. */
export function ForgetPersonDialog({
  personId,
  personName,
}: {
  personId: string;
  personName: string;
}) {
  const { t } = useTranslation(["people", "common"]);
  const forget = useForgetPerson();
  const navigate = useNavigate();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 className="size-4" /> {t("people:forget.action")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("people:forget.confirmTitle", { name: personName })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t("people:forget.confirmDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common:action.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              forget.mutate(personId, {
                onSuccess: (r) => {
                  toast.success(
                    t("people:forget.success", {
                      messages: r.deleted_messages,
                      accounts: r.deleted_accounts,
                    }),
                  );
                  navigate({ to: "/people" });
                },
                onError: () => toast.error(t("people:forget.error")),
              })
            }
          >
            {t("people:forget.confirmAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
