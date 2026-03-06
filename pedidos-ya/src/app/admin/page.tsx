"use client"

import { AppShell } from "@/components/layout/AppShell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, Store, Bike, TrendingUp } from "lucide-react"

export default function AdminPage() {
    return (
        <AppShell>
            <div className="container py-8">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard title="Total Users" value="1,234" icon={<Users className="h-4 w-4 text-[var(--muted-foreground)]" />} />
                    <StatsCard title="Restaurants" value="56" icon={<Store className="h-4 w-4 text-[var(--muted-foreground)]" />} />
                    <StatsCard title="Active Drivers" value="89" icon={<Bike className="h-4 w-4 text-[var(--muted-foreground)]" />} />
                    <StatsCard title="Total Revenue" value="$45,231" icon={<TrendingUp className="h-4 w-4 text-[var(--muted-foreground)]" />} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest system events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <ActivityItem text="New user registered: John Doe" time="2 min ago" />
                                <ActivityItem text="Restaurant 'Pizza Hut' updated menu" time="15 min ago" />
                                <ActivityItem text="Driver 'Speedy' completed delivery #123" time="1 hour ago" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>System Health</CardTitle>
                            <CardDescription>Server status and performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Database</span>
                                    <span className="text-green-600 font-bold">Healthy</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>API Latency</span>
                                    <span className="text-green-600 font-bold">24ms</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    )
}

function StatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-[var(--muted-foreground)]">+12% from last month</p>
            </CardContent>
        </Card>
    )
}

function ActivityItem({ text, time }: { text: string, time: string }) {
    return (
        <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
            <span className="text-sm">{text}</span>
            <span className="text-xs text-[var(--muted-foreground)]">{time}</span>
        </div>
    )
}
