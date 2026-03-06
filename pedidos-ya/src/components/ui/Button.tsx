import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-gray-900 text-white shadow hover:bg-gray-800": variant === "default",
                        "bg-red-600 text-white shadow-sm hover:bg-red-700": variant === "destructive",
                        "border border-gray-200 bg-transparent shadow-sm hover:bg-gray-100 hover:text-gray-900": variant === "outline",
                        "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200": variant === "secondary",
                        "hover:bg-gray-100 hover:text-gray-900": variant === "ghost",
                        "text-red-600 underline-offset-4 hover:underline": variant === "link",
                        "h-9 px-4 py-2": size === "default",
                        "h-8 rounded-md px-3 text-xs": size === "sm",
                        "h-10 rounded-md px-8": size === "lg",
                        "h-9 w-9": size === "icon",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
