import { cn } from "~/utils/cn";
import { Badge } from "./primitives/Badge";
import { SimpleTooltip } from "./primitives/Tooltip";

const textBadgeClassName = "border-0 bg-transparent px-0 system:bg-transparent";

export function AlphaBadge({
  inline = false,
  variant = "badge",
  className,
}: {
  inline?: boolean;
  variant?: "badge" | "text";
  className?: string;
}) {
  return (
    <SimpleTooltip
      button={
        <Badge
          variant="extra-small"
          className={cn(
            variant === "text"
              ? cn(textBadgeClassName, "system:text-blue-500")
              : "system:border-transparent system:bg-blue-500 system:text-white",
            inline ? "inline-grid" : "",
            className
          )}
        >
          Alpha
        </Badge>
      }
      content="This feature is in Alpha"
      disableHoverableContent
    />
  );
}

export function BetaBadge({ inline = false, className }: { inline?: boolean; className?: string }) {
  return (
    <SimpleTooltip
      button={
        <Badge
          variant="extra-small"
          className={cn(
            "system:border-transparent system:bg-blue-500 system:text-white",
            inline ? "inline-grid" : "",
            className
          )}
        >
          Beta
        </Badge>
      }
      content="This feature is in Beta"
      disableHoverableContent
    />
  );
}

export function NewBadge({
  inline = false,
  variant = "badge",
  className,
}: {
  inline?: boolean;
  variant?: "badge" | "text";
  className?: string;
}) {
  return (
    <Badge
      variant="extra-small"
      className={cn(
        variant === "text"
          ? cn(textBadgeClassName, "text-success system:text-success")
          : "text-success system:border-transparent system:bg-success system:text-white",
        inline ? "inline-grid" : "",
        className
      )}
    >
      New
    </Badge>
  );
}
