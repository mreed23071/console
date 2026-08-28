import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui";

export function ThemeToggle() {
  const { t } = useTranslation("nav");
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("theme.toggle")}>
      {theme === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
