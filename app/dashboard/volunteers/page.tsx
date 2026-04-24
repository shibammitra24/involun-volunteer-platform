"use client";

import { useEffect, useState, useMemo } from "react";
import { 
    Users, 
    Mail, 
    MapPin, 
    Briefcase, 
    Calendar, 
    Link as LinkIcon, 
    Loader2,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Search
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Volunteer {
    id: string;
    name: string;
    email: string;
    skills: string[];
    availability: string;
    location: string;
    is_available: boolean;
    created_at: string;
    assignments: {
        id: string;
        status: string;
        created_at: string;
        needs: {
            id: string;
            title: string;
            status: string;
            category: string;
            location: string;
        };
    }[];
}

export default function VolunteersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user && user.role !== "coordinator") {
            router.replace("/dashboard");
        }
    }, [user, router]);

    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                const res = await fetch("/api/get-volunteers");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to fetch");
                setVolunteers(data.volunteers);
            } catch (err: unknown) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === "coordinator") {
            fetchVolunteers();
        }
    }, [user]);

    const filteredVolunteers = useMemo(() => {
        return volunteers.filter(v => 
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [volunteers, searchQuery]);

    if (!user || user.role !== "coordinator") return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Users className="size-5 text-primary" />
                        <h1 className="text-xl font-bold tracking-tight">Volunteer Directory</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage registered volunteers and track their current assignments.
                    </p>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email or skill..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading volunteer data...</p>
                </div>
            ) : filteredVolunteers.length === 0 ? (
                <Card className="border-dashed py-20 text-center">
                    <p className="text-sm font-medium">No volunteers found</p>
                    <p className="text-xs text-muted-foreground">Try a different search term.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredVolunteers.map((volunteer) => (
                        <Card key={volunteer.id} className="overflow-hidden">
                            <CardHeader className="pb-3 border-b bg-muted/20">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">{volunteer.name}</CardTitle>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="size-3" />
                                            {volunteer.email}
                                        </div>
                                    </div>
                                    <Badge variant={volunteer.is_available ? "default" : "outline"} className="uppercase text-[10px] shrink-0">
                                        {volunteer.is_available ? "Available" : "On Assignment"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Briefcase className="size-3" />
                                            <span>Skills</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {volunteer.skills.map(s => (
                                                <Badge key={s} variant="secondary" className="text-[9px] h-4 px-1">{s}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Calendar className="size-3" />
                                            <span>Availability</span>
                                        </div>
                                        <p className="font-medium">{volunteer.availability}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <MapPin className="size-3" />
                                            <span>Location</span>
                                        </div>
                                        <p className="font-medium">{volunteer.location}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <LinkIcon className="size-3" />
                                        Assignments ({volunteer.assignments.length})
                                    </div>
                                    {volunteer.assignments.length === 0 ? (
                                        <p className="text-[11px] italic text-muted-foreground">No current or past assignments.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {volunteer.assignments.map(a => (
                                                <div key={a.id} className="rounded-lg border bg-muted/30 p-2 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-bold truncate">{a.needs.title}</p>
                                                        <Badge className="text-[9px] h-4 px-1 uppercase border-0 bg-primary/10 text-primary">
                                                            {a.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                        <span>{a.needs.category}</span>
                                                        <span>•</span>
                                                        <span>{a.needs.location}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
