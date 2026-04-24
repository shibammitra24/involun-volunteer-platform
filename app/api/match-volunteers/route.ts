import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase-admin";

const MATCH_SYSTEM_PROMPT = `You are an NGO coordinator. Given a community need and a list of available volunteers, find the top 3 best-fit volunteers.

Consider:
1. Skills vs Need Category (e.g. Medical skills for Medical need).
2. Location proximity (if mentioned).
3. Availability.

Return ONLY a valid JSON object (no markdown fences) in this shape:
{ "matches": [ { "volunteer_id": "...", "volunteer_name": "...", "match_score": 8, "reason": "..." } ] }
Include up to 3 matches, or fewer if the list is short. The match_score is 1-10, 10 being perfect.`;

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

        // 1. Fetch available volunteers
        const snapshot = await db.collection("volunteers")
            .where("is_available", "==", true)
            .limit(50)
            .get();

        const volunteers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        if (volunteers.length === 0) {
            return NextResponse.json({ matches: [], message: "No available volunteers found" });
        }

        // 2. AI Matching
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY missing" }, { status: 500 });
        }

        const needInfo = `Title: ${title}
Summary: ${summary}
Urgency: ${urgency}
Category: ${category}
Location: ${location || "Unknown"}`;

        const volunteersList = volunteers
            .map(
                (v) =>
                    `ID: ${v.id}, Name: ${v.name}, Skills: ${v.skills.join(", ")}, Availability: ${v.availability}, Location: ${v.location || "Unknown"}`,
            )
            .join("\n");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel(
            { 
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                },
                thinkingConfig: {
                    thinkingBudget: 0
                }
            } as any,
            { apiVersion: "v1beta" }
        );

        try {
            const prompt = `${MATCH_SYSTEM_PROMPT}\n\nNeed:\n${needInfo}\n\nAvailable Volunteers:\n${volunteersList}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
                parsed = JSON.parse(jsonMatch[0]);
            }
            
            // Support both { matches: [...] } and a bare array
            const matches: MatchResult[] = Array.isArray(parsed) ? parsed : parsed.matches ?? [];

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
