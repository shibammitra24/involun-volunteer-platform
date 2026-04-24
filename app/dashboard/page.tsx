"use client";

import { useAuth } from "@/lib/auth-context";
import { ImpactCounter } from "@/components/impact-counter";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Signed in as{" "}
                    <span className="font-semibold text-foreground">{user?.email}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                        {user?.role.replace("_", " ")}
                    </span>
                </p>
            </div>

            <ImpactCounter />

            <div className="rounded-xl border bg-muted/20 p-6">
                <h3 className="text-sm font-semibold mb-2">Getting Started</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Use the sidebar to navigate between pages. Depending on your role, you can submit new reports, 
                    manage volunteer assignments, or review community impact metrics.
                </p>
            </div>
        </div>
    );
}
