"use client";

import { useState, useEffect } from "react";
import { 
    Type, 
    AlignLeft, 
    Sun, 
    Moon, 
    Settings2,
    Monitor
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { 
    SidebarGroup, 
    SidebarGroupLabel, 
    SidebarGroupContent, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton 
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccessibilityControls() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [fontSize, setFontSize] = useState(1); // 1 = 100%
    const [spacing, setSpacing] = useState(0); // 0 = normal

    // Load from localStorage on mount
    useEffect(() => {
        const savedSize = localStorage.getItem("involun-font-size");
        const savedSpacing = localStorage.getItem("involun-spacing");
        if (savedSize) setFontSize(parseFloat(savedSize));
        if (savedSpacing) setSpacing(parseFloat(savedSpacing));
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty("--font-scale", fontSize.toString());
        localStorage.setItem("involun-font-size", fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        const spacingValue = spacing === 0 ? "normal" : `${spacing}px`;
        document.documentElement.style.setProperty("--letter-spacing", spacingValue);
        localStorage.setItem("involun-spacing", spacing.toString());
    }, [spacing]);

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Preferences</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {/* Theme Toggle */}
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton tooltip="Change Theme">
                                    {resolvedTheme === "dark" ? <Moon /> : <Sun />}
                                    <span>Theme</span>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="bottom" className="w-48">
                                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 text-xs">
                                    <Sun className="size-4" /> Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 text-xs">
                                    <Moon className="size-4" /> Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 text-xs">
                                    <Monitor className="size-4" /> System
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>

                    {/* Accessibility Dropdown */}
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton tooltip="Accessibility Settings">
                                    <Settings2 />
                                    <span>Accessibility</span>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="bottom" className="w-56 p-2 space-y-3">
                                <DropdownMenuLabel>Accessibility Features</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                                            <Type className="size-3" /> Font Size
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground">{Math.round(fontSize * 100)}%</span>
                                    </div>
                                    <div className="flex gap-1 p-1">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 flex-1 text-[10px]" 
                                            onClick={() => setFontSize(prev => Math.max(0.8, prev - 0.1))}
                                        >
                                            A-
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 flex-1 text-[10px]" 
                                            onClick={() => setFontSize(1)}
                                        >
                                            Reset
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 flex-1 text-[10px]" 
                                            onClick={() => setFontSize(prev => Math.min(1.5, prev + 0.1))}
                                        >
                                            A+
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                                            <AlignLeft className="size-3" /> Spacing
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground">{spacing}px</span>
                                    </div>
                                    <div className="flex gap-1 p-1">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 flex-1 text-[10px]" 
                                            onClick={() => setSpacing(prev => Math.max(0, prev - 0.5))}
                                        >
                                            Tight
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 flex-1 text-[10px]" 
                                            onClick={() => setSpacing(0)}
                                        >
                                            Normal
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 flex-1 text-[10px]" 
                                            onClick={() => setSpacing(prev => Math.min(4, prev + 1))}
                                        >
                                            Wide
                                        </Button>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
