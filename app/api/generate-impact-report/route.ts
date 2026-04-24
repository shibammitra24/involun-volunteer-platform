import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY missing" }, { status: 500 });
        }

        // 1. Fetch completed assignments with need details
        // We join with 'needs' to get the impact details
        const { data: assignments, error: fetchError } = await supabase
            .from("assignments")
            .select(`
                id,
                ai_reason,
                status,
                created_at,
                needs (
                    title,
                    ai_summary,
                    urgency,
                    category,
                    location
                ),
                volunteers (
                    name,
                    skills
                )
            `)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(20);

        if (fetchError) {
            console.error("Fetch Assignments Error:", fetchError);
            return NextResponse.json({ error: "Failed to fetch assignment data" }, { status: 500 });
        }

        if (!assignments || assignments.length === 0) {
            return NextResponse.json({ 
                report: "No completed assignments found to generate a report from. Assign volunteers and mark tasks as 'completed' first.",
                empty: true
            });
        }

        // 2. Format data for AI
        const dataSummary = assignments.map(a => {
            const need = a.needs as any;
            const vol = a.volunteers as any;
            return `- Need: ${need.title} (${need.category}) in ${need.location}. Volunteer: ${vol.name} (${vol.skills.join(", ")}). Outcome: ${need.ai_summary}`;
        }).join("\n");

        const groq = new Groq({ apiKey });

        const systemPrompt = `You are an expert NGO communications specialist. Your goal is to write compelling donor impact reports that highlight the human impact and efficiency of volunteer assignments.`;
        const userPrompt = `Summarize these resolved volunteer assignments into a 3-paragraph donor impact report. Be specific about numbers and outcomes:

[data]
${dataSummary}`;

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
        });

        const report = chatCompletion.choices[0]?.message?.content ?? "Failed to generate report.";

        return NextResponse.json({ success: true, report });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Impact Report API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
