"use client";

import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    const langs = [
        { id: "en", label: "EN" },
        { id: "hi", label: "हि" },
        { id: "bn", label: "বাং" },
    ] as const;

    return (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border">
            {langs.map((lang) => (
                <Button
                    key={lang.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-6 px-2 text-[10px] font-bold transition-all",
                        language === lang.id 
                            ? "bg-background text-primary shadow-sm hover:bg-background" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setLanguage(lang.id)}
                >
                    {lang.label}
                </Button>
            ))}
        </div>
    );
}
