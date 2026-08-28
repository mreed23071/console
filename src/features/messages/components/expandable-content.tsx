import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const TRUNCATE_AT = 80;

/** Message body that expands in place when it is longer than one line. */
export function ExpandableContent({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const truncated = content.length > TRUNCATE_AT;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      className="flex max-w-xl items-start gap-1.5 text-left text-sm"
    >
      {truncated &&
        (open ? (
          <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        ))}
      <span>{open || !truncated ? content : `${content.slice(0, TRUNCATE_AT)}…`}</span>
    </button>
  );
}
