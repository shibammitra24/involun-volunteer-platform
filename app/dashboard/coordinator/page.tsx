"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShieldAlert,
    Search,
    Filter,
    Calendar,
    MapPin,
    AlertTriangle,
    Tag,
    Clock,
    ChevronRight,
    Loader2,
    Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface Need {
    id: string;
    title: string;
    raw_description: string;
    ai_summary: string;
    urgency: "low" | "medium" | "high" | "critical";
    category: string;
    location: string;
    status: "open" | "assigned" | "completed";
    created_at: string;
}

const URGENCY_COLORS: Record<string, string> = {
    low: "bg-green-500/10 text-green-600 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

const STATUS_COLORS: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    assigned: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
};

export default function CoordinatorDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [needs, setNeeds] = useState<Need[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [urgencyFilter, setUrgencyFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Selection for side panel
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [matchingResults, setMatchingResults] = useState<any[] | null>(null);

    const handleFindMatches = async () => {
        if (!selectedNeed) return;
        setIsMatching(true);
        setMatchingResults(null);

        try {
            const res = await fetch("/api/match-volunteers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    need_id: selectedNeed.id,
                    title: selectedNeed.title,
                    summary: selectedNeed.ai_summary,
                    urgency: selectedNeed.urgency,
                    category: selectedNeed.category,
                    location: selectedNeed.location,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Matching failed");
            setMatchingResults(data.matches);
        } catch (err: unknown) {
            console.error("Matching Error:", err);
            // We could show a toast here
        } finally {
            setIsMatching(false);
        }
    };

    useEffect(() => {
        setMatchingResults(null);
    }, [selectedNeed]);

    useEffect(() => {
        if (user && user.role !== "coordinator") {
            router.replace("/dashboard");
        }
    }, [user, router]);

    useEffect(() => {
        const fetchNeeds = async () => {
            try {
                const res = await fetch("/api/get-needs");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to fetch");
                setNeeds(data.needs);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.role === "coordinator") {
            fetchNeeds();
        }
    }, [user]);

    const filteredNeeds = useMemo(() => {
        return needs.filter((need) => {
            const matchesSearch =
                need.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                need.location?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesUrgency =
                urgencyFilter === "all" || need.urgency === urgencyFilter;
            const matchesCategory =
                categoryFilter === "all" || need.category === categoryFilter;
            const matchesStatus =
                statusFilter === "all" || need.status === statusFilter;

            return (
                matchesSearch && matchesUrgency && matchesCategory && matchesStatus
            );
        });
    }, [needs, searchQuery, urgencyFilter, categoryFilter, statusFilter]);

    const categories = useMemo(() => {
        const cats = new Set(needs.map((n) => n.category).filter(Boolean));
        return Array.from(cats);
    }, [needs]);

    if (!user || user.role !== "coordinator") {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                <ShieldAlert className="size-8" />
                <p className="text-sm font-medium">Access Denied</p>
                <p className="text-xs">This page is only available to Coordinators.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="size-5 text-primary" />
                        <h1 className="text-xl font-bold tracking-tight">
                            Coordinator Dashboard
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Manage submitted needs and oversee volunteer assignments.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                    >
                        <Clock className="mr-2 size-3.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="bg-muted/30">
                <CardContent className="flex flex-wrap items-end gap-3 p-4">
                    <div className="flex-1 min-w-[200px] space-y-1.5">
                        <Label htmlFor="search" className="text-[10px] uppercase tracking-wider text-muted-foreground">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search title or location..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-[140px] space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Urgency</Label>
                        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Urgency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Urgency</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[140px] space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-[140px] space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Needs List */}
            {isLoading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin" />
                    <p className="text-sm font-medium">Loading needs...</p>
                </div>
            ) : error ? (
                <Card className="border-destructive/20 bg-destructive/5 py-12 text-center">
                    <p className="text-sm font-medium text-destructive">Error: {error}</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
                </Card>
            ) : filteredNeeds.length === 0 ? (
                <Card className="border-dashed py-20 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                        <Filter className="size-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-medium">No needs found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your filters or search query.</p>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {filteredNeeds.map((need) => (
                        <div
                            key={need.id}
                            className="group flex cursor-pointer items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                            onClick={() => setSelectedNeed(need)}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${URGENCY_COLORS[need.urgency] || URGENCY_COLORS.medium}`}>
                                    <AlertTriangle className="size-5" />
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <h3 className="text-sm font-bold leading-none truncate group-hover:text-primary transition-colors">
                                        {need.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            <span className="truncate">{need.location || "Unknown"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {new Date(need.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 ml-4">
                                <div className="hidden sm:flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase tracking-wide">
                                        {need.category}
                                    </Badge>
                                    <Badge className={`text-[10px] h-5 px-1.5 uppercase tracking-wide border-0 ${STATUS_COLORS[need.status] || STATUS_COLORS.open}`}>
                                        {need.status}
                                    </Badge>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Panel */}
            <Sheet open={!!selectedNeed} onOpenChange={(open) => !open && setSelectedNeed(null)}>
                <SheetContent className="sm:max-w-md md:max-w-lg">
                    {selectedNeed && (
                        <div className="h-full flex flex-col">
                            <SheetHeader className="space-y-1 pr-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={`${URGENCY_COLORS[selectedNeed.urgency]} uppercase text-[10px] border-0`}>
                                        {selectedNeed.urgency} Urgency
                                    </Badge>
                                    <Badge className={`${STATUS_COLORS[selectedNeed.status]} uppercase text-[10px] border-0`}>
                                        {selectedNeed.status}
                                    </Badge>
                                </div>
                                <SheetTitle className="text-xl leading-tight">
                                    {selectedNeed.title}
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2 pt-1 text-xs">
                                    <MapPin className="size-3" />
                                    {selectedNeed.location || "Unknown location"}
                                    <Separator orientation="vertical" className="h-3 mx-1" />
                                    <Calendar className="size-3" />
                                    Submitted on {new Date(selectedNeed.created_at).toLocaleString()}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
                                {/* AI Summary Section */}
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Tag className="size-4" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider">AI Summary & Category</h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground/90 italic">
                                        &ldquo;{selectedNeed.ai_summary}&rdquo;
                                    </p>
                                    <div className="pt-2">
                                        <Badge variant="secondary" className="text-xs">
                                            Category: {selectedNeed.selected_category || selectedNeed.category}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Raw Description Section */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Report</h4>
                                    <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedNeed.raw_description}
                                    </div>
                                </div>

                                {/* Action Section */}
                                <div className="space-y-3 pt-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Volunteer Matching
                                    </h4>
                                    {!matchingResults ? (
                                        <Button
                                            className="w-full justify-center gap-2"
                                            onClick={handleFindMatches}
                                            disabled={isMatching}
                                        >
                                            {isMatching ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Analyzing Volunteers...
                                                </>
                                            ) : (
                                                <>
                                                    <Users className="size-4" />
                                                    Find Best Matches with AI
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <div className="space-y-3">
                                            {matchingResults.length === 0 ? (
                                                <p className="text-xs text-center py-4 text-muted-foreground">
                                                    No available volunteers found for this area.
                                                </p>
                                            ) : (
                                                matchingResults.map((match) => (
                                                    <div
                                                        key={match.volunteer_id}
                                                        className="rounded-lg border bg-muted/30 p-3 space-y-2"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="space-y-0.5">
                                                                <p className="text-sm font-bold">
                                                                    {match.volunteer_name}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground leading-snug">
                                                                    {match.reason}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-[10px] h-5 px-1.5 ${
                                                                        match.match_score >= 8
                                                                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                                            : match.match_score >= 5
                                                                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                                            : "bg-red-500/10 text-red-600 border-red-500/20"
                                                                    }`}
                                                                >
                                                                    {match.match_score}/10 Match
                                                                </Badge>
                                                                <Button size="sm" className="h-7 text-[10px] px-2">
                                                                    Assign
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-[10px]"
                                                onClick={() => setMatchingResults(null)}
                                            >
                                                Reset Matches
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t mt-auto">
                                <Button className="w-full" onClick={() => setSelectedNeed(null)}>
                                    Close Details
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
