import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY missing" }, { status: 500 });
        }

        // 1. Fetch completed assignments
        let docs;
        try {
            const assignmentsSnapshot = await db.collection("assignments")
                .where("status", "==", "completed")
                .orderBy("created_at", "desc")
                .limit(20)
                .get();
            docs = assignmentsSnapshot.docs;
        } catch (indexError) {
            console.warn("Impact Report: Index not ready, falling back to in-memory filter...");
            // Fallback: Fetch completed assignments and sort manually in JS
            const snapshot = await db.collection("assignments")
                .where("status", "==", "completed")
                .get();
            docs = snapshot.docs
                .sort((a, b) => (b.data().created_at || "").localeCompare(a.data().created_at || ""))
                .slice(0, 20);
        }

        if (docs.length === 0) {
            return NextResponse.json({ 
                report: "No completed assignments found to generate a report from. Assign volunteers and mark tasks as 'completed' first.",
                empty: true
            });
        }

        // 2. Fetch related needs and volunteers to format data for AI
        const assignments = docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Use Sets to collect unique IDs
        const needIds = [...new Set(assignments.map(a => a.need_id))];
        const volunteerIds = [...new Set(assignments.map(a => a.volunteer_id))];

        // Fetch all needed data
        const needsMap = new Map();
        if (needIds.length > 0) {
            const needsSnapshot = await db.collection("needs").where("__name__", "in", needIds).get();
            needsSnapshot.docs.forEach(doc => needsMap.set(doc.id, doc.data()));
        }

        const volsMap = new Map();
        if (volunteerIds.length > 0) {
            const volsSnapshot = await db.collection("volunteers").where("__name__", "in", volunteerIds).get();
            volsSnapshot.docs.forEach(doc => volsMap.set(doc.id, doc.data()));
        }

        // 3. Format data for AI
        const dataSummary = assignments.map(a => {
            const need = needsMap.get(a.need_id);
            const vol = volsMap.get(a.volunteer_id);
            if (!need || !vol) return null;
            return `- Need: ${need.title} (${need.category}) in ${need.location}. Volunteer: ${vol.name} (${vol.skills.join(", ")}). Outcome: ${need.ai_summary}`;
        }).filter(Boolean).join("\n");

        if (!dataSummary) {
            return NextResponse.json({ 
                report: "No valid data found to generate a report.",
                empty: true
            });
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

        const systemPrompt = `You are an expert NGO communications specialist. Your goal is to write compelling donor impact reports that highlight the human impact and efficiency of volunteer assignments.`;
        const userPrompt = `Summarize these resolved volunteer assignments into a 3-paragraph donor impact report. Be specific about numbers and outcomes:

[data]
${dataSummary}`;

        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const response = await result.response;
        const report = response.text() || "Failed to generate report.";

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
