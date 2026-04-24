"use client";

import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">{user?.email}</span>
                {" · "}
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {user?.role.replace("_", " ")}
                </span>
            </p>
            <p className="text-xs text-muted-foreground">
                Use the sidebar to navigate between pages.
            </p>
        </div>
    );
}
