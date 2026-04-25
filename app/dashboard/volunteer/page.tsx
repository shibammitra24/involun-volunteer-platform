"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { 
    LayoutDashboard, 
    ClipboardList, 
    AlertTriangle, 
    MapPin, 
    Clock, 
    CheckCircle2, 
    Loader2, 
    ExternalLink,
    Search,
    Filter,
    Calendar,
    Users,
    ChevronRight,
    Star,
    ShieldAlert,
    FileText
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    where,
    doc,
    getDoc
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle 
} from "@/components/ui/sheet";

interface Need {
    id: string;
    title: string;
    ai_summary: string;
    urgency: "low" | "medium" | "high" | "critical";
    category: string;
    location: string;
    status: "open" | "assigned" | "completed";
    created_at: string;
}

interface Assignment {
    id: string;
    status: string;
    ai_reason: string;
    created_at: string;
    needs: Need;
}

const URGENCY_COLORS: Record<string, string> = {
    low: "bg-green-500/10 text-green-600 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function VolunteerDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [openNeeds, setOpenNeeds] = useState<Need[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [volunteerProfile, setVolunteerProfile] = useState<any>(null);
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user && user.role !== "volunteer") {
            router.replace("/dashboard");
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.role === "volunteer") {
            let unsubscribeAssignments: (() => void) | null = null;
            let unsubscribeNeeds: (() => void) | null = null;

            const setupSubscriptions = async () => {
                setIsLoading(true);
                try {
                    const identifier = user.name || user.email;
                    // 1. Find volunteer by name/email to get volunteerId
                    const res = await fetch(`/api/get-volunteer-assignments?identifier=${encodeURIComponent(identifier)}`);
                    const initialData = await res.json();
                    
                    if (res.ok && initialData.volunteer) {
                        setVolunteerProfile(initialData.volunteer);
                        const vId = initialData.volunteer.id;

                        // 2. Subscribe to Assignments (Real-time)
                        // Note: orderBy is removed to avoid missing index errors in demo environment.
                        // We sort client-side instead.
                        const assignQuery = query(
                            collection(db, "assignments"),
                            where("volunteer_id", "==", vId)
                        );
                        // Notification Audio for Assignments
                        const assignSound = typeof Audio !== 'undefined' ? new Audio("https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3") : null;
                        if (assignSound) assignSound.volume = 1.0;
                        const isInitialAssignLoad = { current: true };

                        unsubscribeAssignments = onSnapshot(assignQuery, async (snapshot) => {
                            const assignmentsData = await Promise.all(snapshot.docs.map(async (assignDoc) => {
                                // ... (fetching logic)
                                const data = assignDoc.data();
                                // Fetch corresponding Need details
                                const needRef = doc(db, "needs", data.need_id);
                                const needSnap = await getDoc(needRef);
                                
                                return {
                                    id: assignDoc.id,
                                    ...data,
                                    created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at,
                                    needs: needSnap.exists() ? { 
                                        id: needSnap.id, 
                                        ...needSnap.data(),
                                        created_at: (needSnap.data().created_at as any)?.toDate?.()?.toISOString() || needSnap.data().created_at
                                    } : null
                                } as Assignment;
                            }));

                            // Sort client-side by created_at desc
                            const sortedData = assignmentsData.sort((a, b) => 
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                            );
                            
                            // Play sound on new assignment (after initial load)
                            if (isInitialAssignLoad.current) {
                                isInitialAssignLoad.current = false;
                            } else {
                                const added = snapshot.docChanges().some(change => change.type === "added");
                                if (added && assignSound) {
                                    assignSound.play().catch(e => console.log("Audio play blocked", e));
                                    toast.success("New Assignment!", {
                                        description: "A coordinator has assigned you a new task."
                                    });
                                }
                            }

                            setAssignments(sortedData);
                        });
                    }

                    // 3. Subscribe to Open Needs (Real-time)
                    // Note: orderBy is removed to avoid missing index errors. Sorted client-side.
                    const openNeedsQuery = query(
                        collection(db, "needs"), 
                        where("status", "==", "open")
                    );
                    
                    unsubscribeNeeds = onSnapshot(openNeedsQuery, (snapshot) => {
                        const needsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            created_at: (doc.data().created_at as any)?.toDate?.()?.toISOString() || doc.data().created_at
                        })) as Need[];

                        // Sort client-side by created_at desc
                        const sortedNeeds = needsData.sort((a, b) => 
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                        setOpenNeeds(sortedNeeds);
                    });

                } catch (err) {
                    console.error("Error setting up subscriptions:", err);
                    toast.error("Failed to sync data in real-time");
                } finally {
                    setIsLoading(false);
                }
            };

            setupSubscriptions();

            return () => {
                if (unsubscribeAssignments) unsubscribeAssignments();
                if (unsubscribeNeeds) unsubscribeNeeds();
            };
        }
    }, [user]);

    const filteredNeeds = useMemo(() => {
        return openNeeds.filter(n => 
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [openNeeds, searchQuery]);

    const handleUpdateStatus = async (needId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/complete-need", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ need_id: needId }),
            });
            
            if (res.ok) {
                toast.success("Task completed!", {
                    description: "Thank you for your help. The coordinator has been notified."
                });
                // Refresh assignments
                const refreshRes = await fetch(`/api/get-volunteer-assignments?email=${user?.email || ""}`);
                const refreshData = await refreshRes.json();
                if (refreshRes.ok) setAssignments(refreshData.assignments || []);
            } else {
                throw new Error("Failed to update");
            }
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    const [selectedResource, setSelectedResource] = useState<{title: string, content: React.ReactNode} | null>(null);

    const RESOURCE_CONTENT = {
        safety: (
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-700 text-xs flex gap-3">
                    <ShieldAlert className="size-5 shrink-0" />
                    <p>Always prioritize your personal safety. If a situation feels unsafe, withdraw and contact your coordinator immediately.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-sm">Personal Protective Equipment (PPE)</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 ml-1">
                        <li>Wear high-visibility vests at all times on site.</li>
                        <li>Use gloves when handling debris or unknown materials.</li>
                        <li>Sturdy, closed-toe footwear is mandatory.</li>
                    </ul>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-sm">Emergency Protocol</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 ml-1">
                        <li>Identify the nearest medical post upon arrival.</li>
                        <li>Report all incidents, however minor, to the site lead.</li>
                        <li>Keep your mobile device charged and accessible.</li>
                    </ul>
                </div>
            </div>
        ),
        logistics: (
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-blue-700 text-xs flex gap-3">
                    <FileText className="size-5 shrink-0" />
                    <p>Accurate reporting ensures efficient resource allocation. Use the "Mark Done" button as soon as a task is finished.</p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-sm">Transport & Navigation</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 ml-1">
                        <li>Verify exact GPS coordinates before departure.</li>
                        <li>Consolidate trips to save fuel and time.</li>
                        <li>Check road status updates via the platform every 2 hours.</li>
                    </ul>
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold text-sm">Supply Management</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 ml-1">
                        <li>Sign for all equipment taken from the central hub.</li>
                        <li>Photograph received supplies for the digital log.</li>
                        <li>Notify logistics if stock levels fall below 20%.</li>
                    </ul>
                </div>
            </div>
        ),
        support: (
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-green-700 text-xs flex gap-3">
                    <Users className="size-5 shrink-0" />
                    <p>You are part of a community. Reach out if you feel overwhelmed or need technical assistance.</p>
                </div>
                <div className="space-y-4">
                    <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Central Helpline</p>
                        <p className="text-sm font-mono">+91 1800-DEMO-2024</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Technical Support</p>
                        <p className="text-sm">support@involun.org</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Counseling Service</p>
                        <p className="text-sm italic text-muted-foreground underline cursor-pointer hover:text-primary">Click to book a check-in</p>
                    </div>
                </div>
            </div>
        )
    };

    if (!user || user.role !== "volunteer") return null;

    return (
        <div className="space-y-8 pb-10">
            {/* Header omitted for brevity in targetContent match but included in implementation */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Star className="size-5 text-primary fill-primary/20" />
                        <h1 className="text-2xl font-bold tracking-tight">Volunteer Hub</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Welcome back, <span className="text-foreground font-semibold">{volunteerProfile?.name || "Volunteer"}</span>! Here's your current impact and upcoming opportunities.
                    </p>
                </div>
                {volunteerProfile && (
                    <div className="flex items-center gap-3 rounded-full bg-primary/5 border border-primary/10 px-4 py-2">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {volunteerProfile.name[0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">{volunteerProfile.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{volunteerProfile.location}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: My Assignments */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ClipboardList className="size-4" />
                            My Assignments ({assignments.filter(a => a.status !== 'completed').length})
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    ) : assignments.filter(a => a.status !== 'completed').length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="py-8 text-center space-y-2">
                                <p className="text-sm font-medium">No active assignments</p>
                                <p className="text-xs text-muted-foreground">Browse opportunities to find a way to help!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {assignments.filter(a => a.status !== 'completed').map((assignment) => (
                                <Card key={assignment.id} className="overflow-hidden border-primary/20 bg-primary/5">
                                    <CardHeader className="pb-3 border-b border-primary/10">
                                        <div className="flex items-center justify-between">
                                            <Badge className="bg-primary/20 text-primary border-0 text-[10px] uppercase">
                                                {assignment.status}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(assignment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <CardTitle className="text-sm font-bold mt-2">
                                            {assignment.needs?.title || "Unknown Task"}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="size-3" />
                                            {assignment.needs?.location}
                                        </div>
                                        <div className="bg-white/50 rounded-lg p-3 text-[11px] leading-relaxed italic border border-primary/10">
                                            &ldquo;{assignment.ai_reason}&rdquo;
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 flex-1 text-[10px] bg-white hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                                                onClick={() => handleUpdateStatus(assignment.needs?.id)}
                                            >
                                                Mark Done
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setSelectedNeed(assignment.needs)}>
                                                <ExternalLink className="size-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Resources Section */}
                    <div className="pt-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Helpful Resources</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { title: "Safety Protocol", icon: ShieldAlert, content: RESOURCE_CONTENT.safety },
                                { title: "Logistics Guide", icon: FileText, content: RESOURCE_CONTENT.logistics },
                                { title: "Contact Support", icon: Users, content: RESOURCE_CONTENT.support }
                            ].map((res, idx) => (
                                <Button 
                                    key={idx} 
                                    variant="ghost" 
                                    className="justify-start gap-3 h-10 px-3 text-xs text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => setSelectedResource(res)}
                                >
                                    <res.icon className="size-4" />
                                    {res.title}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resource Content Sheet */}
                <Sheet open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
                    <SheetContent className="sm:max-w-md px-8">
                        {selectedResource && (
                            <div className="space-y-6 pt-6">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold">{selectedResource.title}</h2>
                                    </SheetTitle>
                                    <SheetDescription>
                                        Essential guidelines and information for your on-field missions.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="py-4">
                                    {selectedResource.content}
                                </div>
                                <Button className="w-full" variant="outline" onClick={() => setSelectedResource(null)}>
                                    I Understand
                                </Button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>

                {/* Right Column: Opportunities */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="size-4" />
                            Open Opportunities
                        </h3>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search needs..."
                                className="pl-9 h-9 text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : filteredNeeds.length === 0 ? (
                        <Card className="border-dashed py-20 text-center">
                            <p className="text-sm font-medium">All needs are currently covered!</p>
                            <p className="text-xs text-muted-foreground">Check back later for new opportunities.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredNeeds.map((need) => (
                                <Card 
                                    key={need.id} 
                                    className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                                    onClick={() => setSelectedNeed(need)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-[9px] uppercase h-4">
                                                {need.category}
                                            </Badge>
                                            <Badge className={`text-[9px] uppercase h-4 border-0 ${URGENCY_COLORS[need.urgency]}`}>
                                                {need.urgency}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors mt-2">
                                            {need.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                                            {need.ai_summary}
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-muted">
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <MapPin className="size-3" />
                                                {need.location}
                                            </div>
                                            <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Need Details Sheet */}
            <Sheet open={!!selectedNeed} onOpenChange={(open) => !open && setSelectedNeed(null)}>
                <SheetContent className="sm:max-w-md px-8">
                    {selectedNeed && (
                        <div className="space-y-6 pt-4">
                            <SheetHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={`${URGENCY_COLORS[selectedNeed.urgency]} uppercase text-[10px] border-0`}>
                                        {selectedNeed.urgency} Urgency
                                    </Badge>
                                    <Badge variant="secondary" className="uppercase text-[10px]">
                                        {selectedNeed.category}
                                    </Badge>
                                </div>
                                <SheetTitle className="text-xl">{selectedNeed.title}</SheetTitle>
                                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                                    <MapPin className="size-3" />
                                    {selectedNeed.location}
                                    <Separator orientation="vertical" className="h-3 mx-1" />
                                    <Calendar className="size-3" />
                                    {new Date(selectedNeed.created_at).toLocaleDateString()}
                                </div>
                            </SheetHeader>

                            <div className="space-y-4">
                                <div className="rounded-xl bg-muted/50 p-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Detailed Summary</h4>
                                    <p className="text-sm leading-relaxed italic">
                                        &ldquo;{selectedNeed.ai_summary}&rdquo;
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${selectedNeed.status === 'open' ? 'bg-blue-500 animate-pulse' : 'bg-purple-500'}`} />
                                        <span className="text-xs font-medium capitalize">{selectedNeed.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t space-y-3">
                                {selectedNeed.status === "open" && (
                                    <Button className="w-full gap-2" onClick={async () => {
                                        if (!volunteerProfile?.id) {
                                            toast.error("Profile not loaded. Please try again.");
                                            return;
                                        }
                                        try {
                                            const res = await fetch("/api/record-interest", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    need_id: selectedNeed.id,
                                                    volunteer_id: volunteerProfile.id
                                                }),
                                            });
                                            if (res.ok) {
                                                toast.success("Interest recorded!", {
                                                    description: "The coordinator has been notified of your interest."
                                                });
                                                setSelectedNeed(null);
                                            } else {
                                                throw new Error("Failed to record interest");
                                            }
                                        } catch (err) {
                                            toast.error("Something went wrong. Please try again.");
                                        }
                                    }}>
                                        <CheckCircle2 className="size-4" />
                                        I can help with this
                                    </Button>
                                )}
                                <Button variant="outline" className="w-full" onClick={() => setSelectedNeed(null)}>
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
