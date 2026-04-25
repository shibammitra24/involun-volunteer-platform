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
    {
        value: "volunteer",
        label: "Volunteer",
        description: "Browse opportunities & track impact",
    },
];

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<Role | "">("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { user, isLoading, login } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace("/dashboard");
        }
    }, [user, isLoading, router]);

    // Automatically set default credentials based on role
    useEffect(() => {
        if (selectedRole === "coordinator") {
            setUsername("admin");
            setPassword("admin123");
        } else if (selectedRole === "field_staff") {
            setUsername("field_staff_01");
            setPassword("staff123");
        } else if (selectedRole === "volunteer") {
            setUsername("Demo Volunteer");
            setPassword("volunteer123");
        } else {
            setUsername("");
            setPassword("");
        }
    }, [selectedRole]);

    if (isLoading) return null;

    const handleLogin = () => {
        if (!selectedRole || !username) return;
        // In this dummy system, password check is bypassed or fixed
        login(selectedRole, username);
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
                        Demo Environment &mdash; Use provided credentials
                    </p>
                </div>

                {/* ---------- Card ---------- */}
                <Card>
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-lg">Sign in</CardTitle>
                        <CardDescription>
                            Select your role and enter your name/username.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Role selector */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Account Type</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(v) => setSelectedRole(v as Role)}
                            >
                                <SelectTrigger id="role" className="w-full">
                                    <SelectValue placeholder="Select account type…" />
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

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username / Full Name</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder={selectedRole === 'volunteer' ? "Enter your registered name" : "admin"}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={!selectedRole || selectedRole === 'coordinator'}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                readOnly
                                className="cursor-default bg-muted/30"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                * Password is pre-set for demo security
                            </p>
                        </div>

                        {/* Submit */}
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={!selectedRole || !username}
                            onClick={handleLogin}
                        >
                            <LogIn className="mr-2 size-4" />
                            Sign in as {selectedRole ? ROLES.find(r => r.value === selectedRole)?.label : "..."}
                        </Button>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground">
                    Volunteers: Use the name you registered with.
                </p>
            </div>
        </div>
    );
}
