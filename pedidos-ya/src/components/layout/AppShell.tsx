

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen flex-col bg-[var(--background)]">
            <main className="flex-1">
                {children}
            </main>
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                    <p className="text-center text-[12px] font-medium tracking-wide leading-loose text-[var(--muted-foreground)] md:text-left">
                        © 2026 PídeloYa Corporate Solutions.
                    </p>
                </div>
            </footer>
        </div>
    )
}
