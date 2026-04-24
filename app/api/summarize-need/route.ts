import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const AI_SYSTEM_PROMPT = `You are an NGO assistant. Given a raw field report, extract and return ONLY a valid JSON object (no markdown fences, no extra text) with these fields:
- title: (5 word summary)
- summary: (2 sentence clean description)
- urgency: (High / Medium / Low)
- category: (Medical / Food / Education / Infrastructure / Other)
- suggested_volunteers_needed: (number)`;

interface AIResult {
    title: string;
    summary: string;
    urgency: "High" | "Medium" | "Low";
    category: "Medical" | "Food" | "Education" | "Infrastructure" | "Other";
    suggested_volunteers_needed: number;
}

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
        const { raw_description, location, submitter_name } = await req.json();

        if (!raw_description || typeof raw_description !== "string") {
            return NextResponse.json(
                { error: "raw_description is required" },
                { status: 400 },
            );
        }

        // ---- Groq ------------------------------------------------
        const apiKey = process.env.GROQ_API_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!apiKey || !supabaseUrl || !supabaseKey) {
            console.error("Missing environment variables:", {
                apiKey: !!apiKey,
                supabaseUrl: !!supabaseUrl,
                supabaseKey: !!supabaseKey,
            });
            return NextResponse.json(
                { error: "Server configuration error (missing env vars)" },
                { status: 500 },
            );
        }

        const groq = new Groq({ apiKey });

        let aiResult: AIResult;

        try {
            const chatCompletion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: AI_SYSTEM_PROMPT },
                    { role: "user", content: `Raw report:\n\n${raw_description}` },
                ],
                response_format: { type: "json_object" },
                temperature: 0.3,
            });
            const text = chatCompletion.choices[0]?.message?.content ?? "";

            // Extract JSON from the response (handle markdown fences just in case)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Failed to parse AI response");
            }
            aiResult = JSON.parse(jsonMatch[0]);
        } catch (aiErr) {
            console.error("AI Generation failed, using fallback:", aiErr);
            // Fallback result so the database part still works
            aiResult = {
                title: raw_description.slice(0, 30) + "...",
                summary: "AI analysis unavailable. Please review manually.",
                urgency: "Medium",
                category: "Other",
                suggested_volunteers_needed: 2,
            };
        }

        // ---- Supabase ----------------------------------------------
        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("needs")
            .insert({
                title: aiResult.title,
                raw_description,
                ai_summary: aiResult.summary,
                urgency: mapUrgency(aiResult.urgency),
                category: aiResult.category,
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

        return NextResponse.json({
            need: data,
            ai: {
                ...aiResult,
                suggested_volunteers_needed: aiResult.suggested_volunteers_needed,
            },
            submitter_name: submitter_name || "Anonymous",
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("API Route Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
