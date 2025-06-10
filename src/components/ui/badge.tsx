import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        {
          "border-transparent bg-purple-600 text-white hover:bg-purple-700": variant === "default",
          "border-transparent bg-slate-600 text-white hover:bg-slate-500": variant === "secondary",
          "border-transparent bg-red-600 text-white hover:bg-red-700": variant === "destructive",
          "text-white border-slate-500": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge } 