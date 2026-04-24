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
    ChevronLeft,
    Check
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
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/language-context";

interface AiResult {
    title: string;
    summary: string;
    urgency: string;
    category: string;
    suggested_volunteers_needed: number;
}

const CATEGORIES = ["Medical", "Food", "Education", "Infrastructure", "Other"];
const URGENCY_LEVELS = ["Low", "Medium", "High", "Critical"];

const URGENCY_COLORS: Record<string, string> = {
    high: "bg-red-500/10 text-red-600 border-red-500/20",
    critical: "bg-red-600 text-white border-red-700",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-green-500/10 text-green-600 border-green-500/20",
};

export default function SubmitNeedPage() {
    const { t } = useLanguage();

    // Stage 1: Input
    const [location, setLocation] = useState("");
    const [rawDescription, setRawDescription] = useState("");
    const [submitterName, setSubmitterName] = useState("");
    
    // Stage 2: Review/Edit
    const [step, setStep] = useState<"input" | "review" | "success">("input");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Editable AI Results
    const [editedTitle, setEditedTitle] = useState("");
    const [editedSummary, setEditedSummary] = useState("");
    const [editedCategory, setEditedCategory] = useState("");
    const [editedUrgency, setEditedUrgency] = useState("");
    
    // Final Result
    const [finalNeedId, setFinalNeedId] = useState<string | null>(null);

    const canAnalyze = rawDescription.trim().length > 10 && !isAnalyzing;

    const handleAnalyze = async () => {
        if (!canAnalyze) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/analyze-need", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ raw_description: rawDescription.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Analysis failed");

            const { analysis } = data;
            setEditedTitle(analysis.title);
            setEditedSummary(analysis.summary);
            setEditedCategory(analysis.category);
            setEditedUrgency(analysis.urgency);
            
            setStep("review");
            toast.success("AI Analysis complete! Please review.");
        } catch (err: unknown) {
            toast.error("AI analysis failed. You can still fill it manually.");
            // Fallback for manual entry
            setEditedTitle("New Community Need");
            setEditedSummary("");
            setEditedCategory("Other");
            setEditedUrgency("Medium");
            setStep("review");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFinalSubmit = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/save-need", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editedTitle,
                    raw_description: rawDescription,
                    ai_summary: editedSummary,
                    urgency: editedUrgency,
                    category: editedCategory,
                    location: location,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");

            setFinalNeedId(data.need.id);
            setStep("success");
            toast.success("Need officially submitted!");
        } catch (err: unknown) {
            toast.error("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setLocation("");
        setRawDescription("");
        setSubmitterName("");
        setStep("input");
        setFinalNeedId(null);
    };

    // ── Success State ──────────────────────────────────────────────
    if (step === "success") {
        return (
            <div className="mx-auto max-w-2xl space-y-6 py-12 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                    <CheckCircle2 className="size-10" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{t("submit_need.success_title")}</h1>
                    <p className="text-muted-foreground">
                        {t("submit_need.success_description")}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleReset} size="lg" className="gap-2 w-full sm:w-auto">
                        <FileText className="size-4" />
                        {t("submit_need.btn_another")}
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => window.location.href = "/dashboard/coordinator"} className="w-full sm:w-auto">
                        {t("submit_need.btn_dashboard")}
                    </Button>
                </div>
            </div>
        );
    }

    // ── Review/Edit State ──────────────────────────────────────────
    if (step === "review") {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setStep("input")}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t("submit_need.step3")}</h1>
                        <p className="text-sm text-muted-foreground">{t("submit_need.description")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("submit_need.review_title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t("submit_need.review_field_title")}</Label>
                                <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} placeholder="Short descriptive title" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t("submit_need.review_field_summary")}</Label>
                                <Textarea 
                                    className="min-h-[120px] italic" 
                                    value={editedSummary} 
                                    onChange={(e) => setEditedSummary(e.target.value)} 
                                    placeholder="Brief summary for donors..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("submit_need.review_title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <Tag className="size-3.5" />
                                    {t("submit_need.review_field_category")}
                                </Label>
                                <Select value={editedCategory} onValueChange={setEditedCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <AlertTriangle className="size-3.5" />
                                    {t("submit_need.review_field_urgency")}
                                </Label>
                                <Select value={editedUrgency} onValueChange={setEditedUrgency}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Urgency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {URGENCY_LEVELS.map(u => (
                                            <SelectItem key={u} value={u.toLowerCase()}>
                                                {t(`submit_need.urgency.${u.toLowerCase()}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase text-muted-foreground">{t("submit_need.field_location")}</Label>
                                <p className="text-sm font-medium flex items-center gap-1">
                                    <MapPin className="size-3.5" />
                                    {location || "Unspecified"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Button className="w-full h-12 text-lg gap-2" size="lg" onClick={handleFinalSubmit} disabled={isSaving}>
                    {isSaving ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                    {isSaving ? t("submit_need.btn_submitting") : t("submit_need.btn_submit")}
                </Button>
            </div>
        );
    }

    // ── Input State ────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">{t("submit_need.title")}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
                {t("submit_need.description")}
            </p>

            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="submitter-name" className="flex items-center gap-1.5">
                                <User className="size-3.5" />
                                {t("registration.field_name")}
                            </Label>
                            <Input
                                id="submitter-name"
                                placeholder={t("registration.field_name")}
                                value={submitterName}
                                onChange={(e) => setSubmitterName(e.target.value)}
                                disabled={isAnalyzing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-1.5">
                                <MapPin className="size-3.5" />
                                {t("submit_need.field_location")}
                            </Label>
                            <Input
                                id="location"
                                placeholder={t("submit_need.placeholder_location")}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={isAnalyzing}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="raw-description">{t("submit_need.field_need")}</Label>
                        <Textarea
                            id="raw-description"
                            placeholder={t("submit_need.placeholder_need")}
                            className="min-h-[200px] resize-y"
                            value={rawDescription}
                            onChange={(e) => setRawDescription(e.target.value)}
                            disabled={isAnalyzing}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Minimum 10 characters required for AI analysis.
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        disabled={!canAnalyze}
                        onClick={handleAnalyze}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                {t("submit_need.btn_analyzing")}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 size-4" />
                                {t("submit_need.btn_analyze")}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
