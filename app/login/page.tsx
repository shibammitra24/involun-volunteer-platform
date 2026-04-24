"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, LogIn } from "lucide-react";

import { useAuth, type Role } from "@/lib/auth-context";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ROLES: { value: Role; label: string; description: string }[] = [
    {
        value: "coordinator",
        label: "Coordinator",
        description: "Manage needs & assign volunteers",
    },
    {
        value: "field_staff",
        label: "Field Staff",
        description: "View assignments & update status",
    },
];

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<Role | "">("");
    const { user, isLoading, login } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace("/dashboard");
        }
    }, [user, isLoading, router]);

    if (isLoading) return null;

    const handleLogin = () => {
        if (!selectedRole) return;
        login(selectedRole);
        router.push("/dashboard");
    };

    return (
        <div className="flex min-h-svh items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm space-y-6">
                {/* ---------- Branding ---------- */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Shield className="size-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">InVolun</h1>
                    <p className="text-sm text-muted-foreground">
                        Dummy auth &mdash; no real login required
                    </p>
                </div>

                {/* ---------- Card ---------- */}
                <Card>
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-lg">Sign in</CardTitle>
                        <CardDescription>
                            Choose a role to continue as a demo user.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Email (read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value="admin@involun.org"
                                readOnly
                                className="cursor-default opacity-70"
                            />
                        </div>

                        {/* Password (read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value="••••••••••••"
                                readOnly
                                className="cursor-default opacity-70"
                            />
                        </div>

                        {/* Role selector */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(v) => setSelectedRole(v as Role)}
                            >
                                <SelectTrigger id="role" className="w-full">
                                    <SelectValue placeholder="Select a role…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            <span className="font-medium">{r.label}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                — {r.description}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit */}
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={!selectedRole}
                            onClick={handleLogin}
                        >
                            <LogIn className="mr-2 size-4" />
                            Continue as{" "}
                            {selectedRole
                                ? ROLES.find((r) => r.value === selectedRole)?.label
                                : "…"}
                        </Button>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    This is a demo environment. No credentials are stored.
                </p>
            </div>
        </div>
    );
}
