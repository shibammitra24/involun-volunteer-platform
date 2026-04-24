import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const AI_SYSTEM_PROMPT = `You are an NGO assistant. Given a raw field report, extract and return ONLY a valid JSON object (no markdown fences, no extra text) with these fields:
- title: (5 word summary)
- summary: (2 sentence clean description)
- urgency: (High / Medium / Low)
- category: (Medical / Food / Education / Infrastructure / Other)
- suggested_volunteers_needed: (number)`;

export async function POST(req: NextRequest) {
    try {
        const { raw_description } = await req.json();

        if (!raw_description || typeof raw_description !== "string") {
            return NextResponse.json(
                { error: "raw_description is required" },
                { status: 400 },
            );
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing Groq API Key" }, { status: 500 });
        }

        const groq = new Groq({ apiKey });

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
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse AI response");
        }
        const aiResult = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ success: true, analysis: aiResult });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "AI analysis failed", details: message },
            { status: 500 },
        );
    }
}
