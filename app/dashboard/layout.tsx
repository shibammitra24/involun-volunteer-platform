"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login");
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <span className="text-xs text-muted-foreground">
                            InVolun Platform
                        </span>
                    </header>
                    <main className="flex-1 overflow-auto p-6">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
