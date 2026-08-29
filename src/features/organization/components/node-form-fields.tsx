import type { Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NO_PARENT, type NodeFormValues } from "@/features/organization/lib/schemas";
import type { OrgNode } from "@/lib/api/types";

/**
 * Name, description and parent. The parent select is how the hierarchy is
 * built and rearranged — `parentOptions` is filtered by the caller so a node
 * can never be offered itself or its own descendants.
 *
 * Shared by AddNodeDialog and EditNodeDialog, each with their own
 * `useForm<NodeFormValues>()` — this component only needs the resulting
 * `control` to bind fields, not the form instance itself.
 */
export function NodeFormFields({
  control,
  parentOptions,
}: {
  control: Control<NodeFormValues>;
  parentOptions: OrgNode[];
}) {
  const { t } = useTranslation("organization");

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("field.name")}</FormLabel>
            <FormControl>
              <Input placeholder={t("field.namePlaceholder")} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("field.subtitle")}</FormLabel>
            <FormControl>
              <Input placeholder={t("field.subtitlePlaceholder")} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="parentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("field.parent")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NO_PARENT}>{t("field.noParent")}</SelectItem>
                {parentOptions.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
