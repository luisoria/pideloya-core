import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { X } from "lucide-react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-0">
            <div className="w-full max-w-md rounded-lg bg-[var(--background)] shadow-lg animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b p-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-4">
                    {children}
                </div>
                {footer && (
                    <div className="border-t p-4 bg-[var(--muted)]/20 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
