import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-primary-500 text-white border-transparent",
        variant === "secondary" && "bg-slate-100 text-slate-900 border-transparent",
        variant === "outline" && "text-slate-900 border-slate-200",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
