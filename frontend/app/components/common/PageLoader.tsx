import { Loader2 } from "lucide-react";

import { cn } from "~/lib/utils";

interface PageLoaderProps {
  size?: "sm" | "lg";
  className?: string;
}

const VARIANTS: Record<NonNullable<PageLoaderProps["size"]>, { wrapper: string; icon: string }> = {
  sm: { wrapper: "flex items-center justify-center py-10", icon: "h-6 w-6" },
  lg: { wrapper: "flex items-center justify-center py-20", icon: "h-8 w-8" },
};

export function PageLoader({ size = "lg", className }: PageLoaderProps) {
  const variant = VARIANTS[size];

  return (
    <div className={cn(variant.wrapper, className)}>
      <Loader2 className={cn(variant.icon, "animate-spin text-miami-600")} />
    </div>
  );
}
