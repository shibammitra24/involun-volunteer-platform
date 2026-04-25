"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FileText,
    Users,
    LayoutDashboard,
    Shield,
    Lock,
    LogOut,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { AccessibilityControls } from "@/components/accessibility-controls";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
    {
        title: "Submit Need",
        href: "/dashboard/submit-need",
        icon: FileText,
        protected: false,
    },
    {
        title: "Volunteer Registration",
        href: "/dashboard/volunteer-registration",
        icon: Users,
        protected: false,
        roles: ["coordinator", "field_staff"],
    },
    {
        title: "Volunteer Dashboard",
        href: "/dashboard/volunteer",
        icon: LayoutDashboard,
        roles: ["volunteer"],
    },
    {
        title: "Coordinator Dashboard",
        href: "/dashboard/coordinator",
        icon: LayoutDashboard,
        roles: ["coordinator"],
    },
    {
        title: "Volunteers",
        href: "/dashboard/volunteers",
        icon: Users,
        roles: ["coordinator"],
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <Sidebar>
            {/* ---- Header / Brand ---- */}
            <SidebarHeader className="p-4">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Shield className="size-4" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">InVolun</span>
                </Link>
            </SidebarHeader>

            <SidebarSeparator />

            {/* ---- Navigation ---- */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map((item: any) => {
                                const isActive = pathname === item.href;
                                
                                // Role-based visibility
                                if (item.roles && !item.roles.includes(user?.role)) {
                                    return null;
                                }

                                const isLocked =
                                    item.protected && user?.role !== "coordinator";

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <Link
                                                href={isLocked ? "#" : item.href}
                                                aria-disabled={isLocked}
                                                className={
                                                    isLocked
                                                        ? "pointer-events-none opacity-50"
                                                        : undefined
                                                }
                                            >
                                                <item.icon />
                                                <span>{item.title}</span>
                                                {isLocked && (
                                                    <Lock className="ml-auto size-3 text-muted-foreground" />
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />
                
                <AccessibilityControls />
            </SidebarContent>

            {/* ---- Footer / User ---- */}
            <SidebarFooter className="p-3">
                <SidebarSeparator className="mx-0 mb-2" />
                {user && (
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-xs font-bold uppercase text-muted-foreground">
                            {user.email[0]}
                        </div>
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-xs font-medium">
                                {user.email}
                            </span>
                            <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                                {user.role.replace("_", " ")}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            onClick={() => logout()}
                        >
                            <LogOut className="size-3.5" />
                            <span className="sr-only">Sign out</span>
                        </Button>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
