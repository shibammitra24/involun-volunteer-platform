import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function mapUrgency(u: string): "low" | "medium" | "high" {
    switch (u.toLowerCase()) {
        case "high":
            return "high";
        case "low":
            return "low";
        default:
            return "medium";
    }
}

export async function POST(req: NextRequest) {
    try {
        const { title, raw_description, ai_summary, urgency, category, location } = await req.json();

        if (!title || !raw_description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("needs")
            .insert({
                title,
                raw_description,
                ai_summary,
                urgency: mapUrgency(urgency),
                category,
                location: location || null,
                status: "open",
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json(
                { error: "Database error", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true, need: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "Save failed", details: message },
            { status: 500 },
        );
    }
}
