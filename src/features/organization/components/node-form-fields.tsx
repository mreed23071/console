import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrgNode } from "@/lib/api/types";

/** Select needs a non-empty string value, so roots get a sentinel. */
export const NO_PARENT = "__root__";

export interface NodeFormState {
  name: string;
  subtitle: string;
  parentId: string;
}

/**
 * Name, description and parent. The parent select is how the hierarchy is
 * built and rearranged — `parentOptions` is filtered by the caller so a node
 * can never be offered itself or its own descendants.
 */
export function NodeFormFields({
  idPrefix,
  value,
  onChange,
  parentOptions,
}: {
  idPrefix: string;
  value: NodeFormState;
  onChange: (patch: Partial<NodeFormState>) => void;
  parentOptions: OrgNode[];
}) {
  const { t } = useTranslation("organization");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-name`}>{t("field.name")}</Label>
        <Input
          id={`${idPrefix}-name`}
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t("field.namePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-subtitle`}>{t("field.subtitle")}</Label>
        <Input
          id={`${idPrefix}-subtitle`}
          value={value.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("field.subtitlePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-parent`}>{t("field.parent")}</Label>
        <Select value={value.parentId} onValueChange={(parentId) => onChange({ parentId })}>
          <SelectTrigger id={`${idPrefix}-parent`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PARENT}>{t("field.noParent")}</SelectItem>
            {parentOptions.map((node) => (
              <SelectItem key={node.id} value={node.id}>
                {node.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
