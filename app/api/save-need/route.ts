import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

function mapUrgency(u: string): "low" | "medium" | "high" {
    switch (u.toLowerCase()) {
        case "high":
        case "critical":
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

        const needData = {
            title,
            raw_description,
            ai_summary,
            urgency: mapUrgency(urgency),
            category,
            location: location || null,
            status: "open",
            created_at: new Date().toISOString(),
        };

        const docRef = await db.collection("needs").add(needData);
        const savedNeed = { id: docRef.id, ...needData };

        return NextResponse.json({ success: true, need: savedNeed });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Save Need API Error:", err);
        return NextResponse.json(
            { error: "Save failed", details: message },
            { status: 500 },
        );
    }
}
