"use client"

import { Button } from "@/components/ui/Button"
import { LogOut } from "lucide-react"
import { logout } from "@/app/login/actions"

export function UserMenu({ user }: { user: any }) {
    return (
        <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-right">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-[var(--muted-foreground)] capitalize">{user.role}</div>
            </div>
            <form action={logout}>
                <Button variant="ghost" size="icon" title="Sign Out">
                    <LogOut className="h-5 w-5" />
                </Button>
            </form>
        </div>
    )
}
