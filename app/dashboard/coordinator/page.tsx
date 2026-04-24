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
    FileText,
    Copy,
    Check,
    Eye,
    CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
    const [isAssigning, setIsAssigning] = useState<string | null>(null); // volunteer_id being assigned
    const [matchingResults, setMatchingResults] = useState<any[] | null>(null);
    const [currentAssignments, setCurrentAssignments] = useState<any[] | null>(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            if (!selectedNeed || selectedNeed.status === "open") {
                setCurrentAssignments(null);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("assignments")
                    .select("*, volunteers(*)")
                    .eq("need_id", selectedNeed.id);
                
                if (error) throw error;
                setCurrentAssignments(data);
            } catch (err) {
                console.error("Fetch Assignments Error:", err);
            }
        };

        fetchAssignments();
    }, [selectedNeed]);

    // Impact Report states
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportContent, setReportContent] = useState<string | null>(null);
    const [showReportSheet, setShowReportSheet] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = async () => {
        if (!selectedNeed) return;
        setIsCompleting(true);
        try {
            const res = await fetch("/api/complete-need", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ need_id: selectedNeed.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Completion failed");
            
            toast.success("Need resolved!", {
                description: "Volunteers have been freed for new tasks.",
            });
            
            // Local update for immediate feedback
            setNeeds(prev => prev.map(n => 
                n.id === selectedNeed.id ? { ...n, status: "completed" } : n
            ));
            setSelectedNeed(prev => prev ? { ...prev, status: "completed" } : null);
        } catch (err: unknown) {
            console.error("Complete Error:", err);
            toast.error("Failed to mark as complete.");
        } finally {
            setIsCompleting(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const res = await fetch("/api/generate-impact-report", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed");
            setReportContent(data.report);
            setShowReportSheet(true);
            toast.success("Impact report generated!");
        } catch (err: unknown) {
            console.error("Report Error:", err);
            toast.error("Failed to generate impact report.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const copyToClipboard = () => {
        if (!reportContent) return;
        navigator.clipboard.writeText(reportContent);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleAssign = async (volunteerId: string, reason: string) => {
        if (!selectedNeed) return;
        setIsAssigning(volunteerId);

        try {
            const res = await fetch("/api/assign-volunteer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    need_id: selectedNeed.id,
                    volunteer_id: volunteerId,
                    reason,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Assignment failed");

            toast.success("Volunteer assigned successfully!");
            // Update local state for immediate feedback (though real-time will handle it too)
            setNeeds(prev => prev.map(n => 
                n.id === selectedNeed.id ? { ...n, status: "assigned" } : n
            ));
            setSelectedNeed(prev => prev ? { ...prev, status: "assigned" } : null);
            setMatchingResults(null);
        } catch (err: unknown) {
            console.error("Assignment Error:", err);
        } finally {
            setIsAssigning(null);
        }
    };

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
            toast.success("AI Matching complete!", {
                description: `Found ${data.matches.length} suitable volunteers.`,
            });
        } catch (err: unknown) {
            console.error("Matching Error:", err);
            toast.error("Matching failed. Please try again.");
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

            // Real-time subscription
            const channel = supabase
                .channel("needs_changes")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "needs",
                    },
                    (payload) => {
                        if (payload.eventType === "INSERT") {
                            setNeeds((prev) => [payload.new as Need, ...prev]);
                        } else if (payload.eventType === "UPDATE") {
                            setNeeds((prev) =>
                                prev.map((n) =>
                                    n.id === payload.new.id ? (payload.new as Need) : n
                                )
                            );
                        } else if (payload.eventType === "DELETE") {
                            setNeeds((prev) => prev.filter((n) => n.id !== payload.old.id));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="h-8"
                    >
                        <Clock className="mr-2 size-3.5" />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        className="gap-2 h-8"
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport}
                    >
                        {isGeneratingReport ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <FileText className="size-3.5" />
                        )}
                        <span className="hidden sm:inline">Generate Weekly Report</span>
                        <span className="sm:hidden text-[10px]">Impact Report</span>
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="bg-muted/30 border-none sm:border">
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-4 p-4 lg:p-6">
                    <div className="space-y-1.5">
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

                    <div className="w-full space-y-1.5">
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

                    <div className="w-full space-y-1.5">
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

                    <div className="w-full space-y-1.5">
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
                            className="group flex flex-col sm:flex-row cursor-pointer sm:items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm gap-4"
                            onClick={() => setSelectedNeed(need)}
                        >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                <div className={`flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg border ${URGENCY_COLORS[need.urgency] || URGENCY_COLORS.medium}`}>
                                    <AlertTriangle className="size-4 sm:size-5" />
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <h3 className="text-[13px] sm:text-sm font-bold leading-tight truncate group-hover:text-primary transition-colors">
                                        {need.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            <span className="truncate max-w-[100px] sm:max-w-none">{need.location || "Unknown"}</span>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {new Date(need.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5 uppercase tracking-wide">
                                        {need.category}
                                    </Badge>
                                    <Badge className={`text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5 uppercase tracking-wide border-0 ${STATUS_COLORS[need.status] || STATUS_COLORS.open}`}>
                                        {need.status}
                                    </Badge>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Panel */}
            <Sheet open={!!selectedNeed} onOpenChange={(open) => !open && setSelectedNeed(null)}>
                <SheetContent className="!w-full !max-w-full !h-full sm:!h-auto sm:!max-w-md md:!max-w-lg overflow-y-auto p-6 border-none sm:border rounded-none sm:rounded-l-xl">
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
                                            Category: {selectedNeed.category}
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
                                                                <Button 
                                                                    size="sm" 
                                                                    className="h-7 text-[10px] px-2"
                                                                    onClick={() => handleAssign(match.volunteer_id, match.reason)}
                                                                    disabled={isAssigning !== null || selectedNeed.status === "completed"}
                                                                >
                                                                    {isAssigning === match.volunteer_id ? (
                                                                        <Loader2 className="size-3 animate-spin" />
                                                                    ) : (
                                                                        "Assign"
                                                                    )}
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

                                {/* Current Assignments Section */}
                                {selectedNeed.status !== "open" && currentAssignments && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Current Assignment
                                        </h4>
                                        <div className="space-y-3">
                                            {currentAssignments.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic">No assignment records found.</p>
                                            ) : (
                                                currentAssignments.map((assignment) => (
                                                    <div key={assignment.id} className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex size-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold">
                                                                    {assignment.volunteers?.name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold">{assignment.volunteers?.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{assignment.volunteers?.email}</p>
                                                                </div>
                                                            </div>
                                                            <Badge className="text-[10px] h-5 px-1.5 uppercase border-0 bg-purple-500/10 text-purple-600">
                                                                {assignment.status}
                                                            </Badge>
                                                        </div>
                                                        {assignment.ai_reason && (
                                                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                                                                &ldquo;{assignment.ai_reason}&rdquo;
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 pt-2">
                                                            <Button variant="outline" size="sm" className="h-7 text-[10px] w-full gap-1" onClick={() => router.push("/dashboard/volunteers")}>
                                                                <Eye className="size-3" />
                                                                View Volunteer Profile
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t mt-auto space-y-3">
                                {selectedNeed.status === "assigned" && (
                                    <Button 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" 
                                        onClick={handleComplete}
                                        disabled={isCompleting}
                                    >
                                        {isCompleting ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="size-4" />
                                        )}
                                        Mark as Resolved (Completed)
                                    </Button>
                                )}
                                <Button className="w-full" variant="outline" onClick={() => setSelectedNeed(null)}>
                                    Close Details
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Impact Report Sheet */}
            <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
                <SheetContent className="!w-full !max-w-full !h-full sm:!h-auto sm:!max-w-xl overflow-y-auto p-6 border-none sm:border rounded-none sm:rounded-l-xl">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <FileText className="size-5" />
                            <h4 className="text-xs font-bold uppercase tracking-wider">AI Impact Generator</h4>
                        </div>
                        <SheetTitle className="text-2xl font-bold">Donor Impact Report</SheetTitle>
                        <SheetDescription>
                            A 3-paragraph summary of recent resolved assignments for your donors.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-8 relative">
                        <div className="rounded-2xl border bg-muted/30 p-6 text-sm leading-relaxed whitespace-pre-wrap font-serif italic text-foreground/90">
                            {reportContent}
                        </div>
                        
                        <div className="mt-6 flex gap-3">
                            <Button className="flex-1 gap-2" onClick={copyToClipboard}>
                                {hasCopied ? (
                                    <>
                                        <Check className="size-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        Copy Report Text
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={() => setShowReportSheet(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
