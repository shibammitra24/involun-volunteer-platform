import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const MATCH_PROMPT = `You are an NGO coordinator. Given a specific community need and a list of available volunteers, find the top 3 best-fit volunteers.

Consider:
1. Skills vs Need Category (e.g. Medical skills for Medical need).
2. Location proximity (if mentioned).
3. Availability.

Return ONLY a JSON array of top 3 matches (or fewer if not enough volunteers), each with:
- volunteer_id: (UUID from the list)
- volunteer_name: (Name from the list)
- match_score: (1-10, where 10 is perfect)
- reason: (one concise sentence explaining why they are a good fit)

Need:
`;

interface MatchResult {
    volunteer_id: string;
    volunteer_name: string;
    match_score: number;
    reason: string;
}

export async function POST(req: NextRequest) {
    try {
        const { need_id, title, summary, urgency, category, location } = await req.json();

        if (!need_id) {
            return NextResponse.json({ error: "need_id is required" }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        // 1. Fetch available volunteers
        const { data: volunteers, error: vError } = await supabase
            .from("volunteers")
            .select("id, name, skills, availability, location")
            .eq("is_available", true)
            .limit(50); // Get a reasonable sample for AI to process

        if (vError) {
            console.error("Supabase Error (Fetch Volunteers):", vError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        if (!volunteers || volunteers.length === 0) {
            return NextResponse.json({ matches: [], message: "No available volunteers found" });
        }

        // 2. AI Matching
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
        }


        const needInfo = `
            Title: ${title}
            Summary: ${summary}
            Urgency: ${urgency}
            Category: ${category}
            Location: ${location || "Unknown"}
        `;

        const volunteersList = volunteers.map(v => 
            `ID: ${v.id}, Name: ${v.name}, Skills: ${v.skills.join(", ")}, Availability: ${v.availability}, Location: ${v.location || "Unknown"}`
        ).join("\n");

        const prompt = `${MATCH_PROMPT}${needInfo}\n\nAvailable Volunteers:\n${volunteersList}`;

        const genAI = new GoogleGenAI({ apiKey });

        try {
            const result = await genAI.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt,
            });
            const text = result.text ?? "";

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("Failed to parse AI response");

            const matches: MatchResult[] = JSON.parse(jsonMatch[0]);

            return NextResponse.json({
                success: true,
                matches: matches.slice(0, 3),
            });
        } catch (aiErr) {
            console.error("AI Matching failed:", aiErr);
            // Fallback: just return the first 3 if AI fails (better than nothing for demo)
            const fallbackMatches = volunteers.slice(0, 3).map(v => ({
                volunteer_id: v.id,
                volunteer_name: v.name,
                match_score: 5,
                reason: "Available volunteer (AI matching unavailable)."
            }));

            return NextResponse.json({
                success: true,
                matches: fallbackMatches,
                ai_failed: true
            });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Match Volunteers API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
