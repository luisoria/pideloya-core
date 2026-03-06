import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/80": variant === "default",
                    "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80": variant === "secondary",
                    "border-transparent bg-[var(--destructive)] text-white hover:bg-[var(--destructive)]/80": variant === "destructive",
                    "text-foreground": variant === "outline",
                    "border-transparent bg-[var(--success)] text-white hover:bg-[var(--success)]/80": variant === "success",
                    "border-transparent bg-[var(--warning)] text-white hover:bg-[var(--warning)]/80": variant === "warning",
                },
                className
            )}
            {...props}
        />
    )
}

export { Badge }
