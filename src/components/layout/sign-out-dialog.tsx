import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/features/auth";

/**
 * Shared confirmation for the two places sign-out is offered (the user menu
 * and the sidebar footer), so the copy and the redirect stay in one place.
 */
export function SignOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation(["auth", "common"]);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("auth:signOut.confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("auth:signOut.confirmDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common:action.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              signOut();
              navigate({ to: "/login", replace: true });
            }}
          >
            {t("auth:signOut.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
