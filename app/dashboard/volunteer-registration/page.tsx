"use client";

import { useState } from "react";
import {
    Users,
    Mail,
    User,
    MapPin,
    CheckCircle2,
    Loader2,
    Briefcase,
    Calendar,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/lib/language-context";

const SKILLS = [
    "first_aid",
    "logistics",
    "cooking",
    "counseling",
    "heavy_lifting",
    "transport",
];
const AVAILABILITY_OPTIONS = ["weekdays", "weekends", "on_call"];

export default function VolunteerRegistrationPage() {
    const { t } = useLanguage();
    
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [location, setLocation] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSkillChange = (skill: string) => {
        setSelectedSkills((prev) =>
            prev.includes(skill)
                ? prev.filter((s) => s !== skill)
                : [...prev, skill],
        );
    };

    const handleAvailabilityChange = (option: string) => {
        setSelectedAvailability((prev) =>
            prev.includes(option)
                ? prev.filter((o) => o !== option)
                : [...prev, option],
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/register-volunteer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    skills: selectedSkills.map(s => t(`registration.skills.${s}`)),
                    availability: selectedAvailability.map(a => t(`registration.availability.${a}`)).join(", "),
                    location,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setIsSuccess(true);
            toast.success(t("registration.success_title"));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="mx-auto max-w-xl py-12">
                <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <CardTitle className="text-xl">{t("registration.success_title")}</CardTitle>
                        <CardDescription>
                            {t("registration.success_description")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button
                            onClick={() => {
                                setIsSuccess(false);
                                setName("");
                                setEmail("");
                                setLocation("");
                                setSelectedSkills([]);
                                setSelectedAvailability([]);
                            }}
                            variant="outline"
                        >
                            Register Another Volunteer
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">
                    {t("registration.title")}
                </h1>
            </div>
            <p className="text-sm text-muted-foreground">
                {t("registration.description")}
            </p>

            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-lg">{t("registration.section_personal")}</CardTitle>
                    <CardDescription>
                        {t("registration.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-1.5">
                                    <User className="size-3.5" />
                                    {t("registration.field_name")}
                                </Label>
                                <Input
                                    id="name"
                                    placeholder={t("registration.field_name")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-1.5">
                                    <Mail className="size-3.5" />
                                    {t("registration.field_email")}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Location */}
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
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Skills */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-1.5">
                                <Briefcase className="size-3.5" />
                                {t("registration.field_skills")}
                            </Label>
                            <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-3">
                                {SKILLS.map((skill) => (
                                    <div key={skill} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`skill-${skill}`}
                                            checked={selectedSkills.includes(skill)}
                                            onCheckedChange={() => handleSkillChange(skill)}
                                            disabled={isSubmitting}
                                        />
                                        <label
                                            htmlFor={`skill-${skill}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {t(`registration.skills.${skill}`)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Availability */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-1.5">
                                <Calendar className="size-3.5" />
                                {t("registration.field_availability")}
                            </Label>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-lg border p-4">
                                {AVAILABILITY_OPTIONS.map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`avail-${option}`}
                                            checked={selectedAvailability.includes(option)}
                                            onCheckedChange={() => handleAvailabilityChange(option)}
                                            disabled={isSubmitting}
                                        />
                                        <label
                                            htmlFor={`avail-${option}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {t(`registration.availability.${option}`)}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                                <span className="font-medium">Error:</span> {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    {t("registration.btn_registering")}
                                </>
                            ) : (
                                t("registration.btn_register")
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
