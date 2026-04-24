"use client";

import { useState } from "react";
import {
    FileText,
    Send,
    Loader2,
    CheckCircle2,
    MapPin,
    User,
    AlertTriangle,
    Tag,
    Users,
    Sparkles,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface AiResult {
    title: string;
    summary: string;
    urgency: string;
    category: string;
    suggested_volunteers_needed: number;
}

interface SubmitResponse {
    need: {
        id: string;
        title: string;
        raw_description: string;
        ai_summary: string;
        urgency: string;
        category: string;
        location: string | null;
        status: string;
        created_at: string;
    };
    ai: AiResult;
    submitter_name: string;
}

const URGENCY_COLORS: Record<string, string> = {
    high: "bg-red-500/10 text-red-600 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-green-500/10 text-green-600 border-green-500/20",
};

export default function SubmitNeedPage() {
    const [location, setLocation] = useState("");
    const [rawDescription, setRawDescription] = useState("");
    const [submitterName, setSubmitterName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canSubmit =
        rawDescription.trim().length > 10 && !isSubmitting && !result;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/summarize-need", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_description: rawDescription.trim(),
                    location: location.trim() || null,
                    submitter_name: submitterName.trim() || "Anonymous",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setResult(data as SubmitResponse);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setLocation("");
        setRawDescription("");
        setSubmitterName("");
        setResult(null);
        setError(null);
    };

    // ── Success Card ──────────────────────────────────────────────
    if (result) {
        const { need, ai, submitter_name } = result;
        const urgencyColor =
            URGENCY_COLORS[need.urgency] || URGENCY_COLORS.medium;

        return (
            <div className="mx-auto max-w-2xl space-y-6">
                {/* Success header */}
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            Need Submitted Successfully
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            AI has processed your report. Here&apos;s the summary.
                        </p>
                    </div>
                </div>

                {/* AI-generated card */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Sparkles className="size-4 text-primary" />
                                    {need.title}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Submitted by {submitter_name}
                                </CardDescription>
                            </div>
                            <Badge
                                variant="outline"
                                className={`shrink-0 text-[10px] uppercase ${urgencyColor}`}
                            >
                                {need.urgency} urgency
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* AI Summary */}
                        <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-3">
                            <p className="text-xs font-medium text-primary/80">
                                AI Summary
                            </p>
                            <p className="mt-1 text-sm leading-relaxed">{need.ai_summary}</p>
                        </div>

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                                <Tag className="size-3.5 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] text-muted-foreground">Category</p>
                                    <p className="text-xs font-medium">{ai.category}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                                <Users className="size-3.5 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Volunteers Needed
                                    </p>
                                    <p className="text-xs font-medium">
                                        {ai.suggested_volunteers_needed}
                                    </p>
                                </div>
                            </div>

                            {need.location && (
                                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                                    <MapPin className="size-3.5 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Location
                                        </p>
                                        <p className="text-xs font-medium">{need.location}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                                <AlertTriangle className="size-3.5 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] text-muted-foreground">Status</p>
                                    <p className="text-xs font-medium capitalize">
                                        {need.status}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Raw description (collapsed) */}
                        <details className="group">
                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                                View original report
                            </summary>
                            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                                {need.raw_description}
                            </p>
                        </details>
                    </CardContent>
                </Card>

                <Button onClick={handleReset} className="w-full" variant="outline">
                    Submit Another Need
                </Button>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">Submit Need</h1>
            </div>
            <p className="text-sm text-muted-foreground">
                Describe a community need. AI will automatically summarize, categorize,
                and determine urgency.
            </p>

            <Card>
                <CardContent className="space-y-4 pt-6">
                    {/* Submitter Name */}
                    <div className="space-y-2">
                        <Label htmlFor="submitter-name" className="flex items-center gap-1.5">
                            <User className="size-3.5" />
                            Submitter Name
                        </Label>
                        <Input
                            id="submitter-name"
                            placeholder="Your name (optional)"
                            value={submitterName}
                            onChange={(e) => setSubmitterName(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            Location
                        </Label>
                        <Input
                            id="location"
                            placeholder="e.g. Village name, District, State"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Raw Description */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="raw-description"
                            className="flex items-center gap-1.5"
                        >
                            <FileText className="size-3.5" />
                            Raw Description
                        </Label>
                        <Textarea
                            id="raw-description"
                            placeholder="Describe the situation in detail. Include what happened, who is affected, what resources are needed, and any urgency..."
                            className="min-h-[160px] resize-y"
                            value={rawDescription}
                            onChange={(e) => setRawDescription(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Minimum 10 characters.{" "}
                            {rawDescription.length > 0 && (
                                <span className="font-mono">{rawDescription.length} chars</span>
                            )}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        className="w-full"
                        size="lg"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                AI is processing your report…
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 size-4" />
                                Submit &amp; Analyze with AI
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
