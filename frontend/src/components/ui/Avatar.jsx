import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "../../lib/utils";

const SIZES = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function Avatar({ src, fallback, size = "md", className }) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-bg-overlay border border-border",
        SIZES[size],
        className
      )}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={fallback}
        className="h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        delayMs={300}
        className="flex h-full w-full items-center justify-center bg-bg-overlay text-slate-400 font-medium"
      >
        {fallback?.[0]?.toUpperCase() ?? "?"}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
