import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase-admin";

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

        // ---- Gemini ------------------------------------------------
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Missing Gemini API key");
            return NextResponse.json(
                { error: "Server configuration error (missing AI key)" },
                { status: 500 },
            );
        }

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
            } as any
        );

        let aiResult: AIResult;

        try {
            const prompt = `${AI_SYSTEM_PROMPT}\n\nRaw report:\n\n${raw_description}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            try {
                aiResult = JSON.parse(text);
            } catch (e) {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
                aiResult = JSON.parse(jsonMatch[0]);
            }
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

        // ---- Firebase ----------------------------------------------
        const needData = {
            title: aiResult.title,
            raw_description,
            ai_summary: aiResult.summary,
            urgency: mapUrgency(aiResult.urgency),
            category: aiResult.category,
            location: location || null,
            status: "open",
            created_at: new Date().toISOString(),
        };

        const docRef = await db.collection("needs").add(needData);
        const savedNeed = { id: docRef.id, ...needData };

        return NextResponse.json({
            need: savedNeed,
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
