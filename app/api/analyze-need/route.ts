import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const AI_SYSTEM_PROMPT = `You are an NGO assistant. Given a raw field report, extract and return ONLY a valid JSON object (no markdown fences, no extra text) with these fields:
- title: (5 word summary)
- summary: (2 sentence clean description)
- urgency: (high / medium / low / critical)
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

        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 500 });
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

        const prompt = `${AI_SYSTEM_PROMPT}\n\nRaw report:\n\n${raw_description}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            const aiResult = JSON.parse(text);
            return NextResponse.json({ success: true, analysis: aiResult });
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
            const aiResult = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ success: true, analysis: aiResult });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json(
            { error: "AI analysis failed", details: message },
            { status: 500 },
        );
    }
}
