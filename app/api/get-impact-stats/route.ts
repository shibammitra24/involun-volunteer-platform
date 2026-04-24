import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 1. Total Needs
        const needsCount = await db.collection("needs").count().get();
        const totalNeeds = needsCount.data().count;

        // 2. Total Volunteers
        const volCount = await db.collection("volunteers").count().get();
        const totalVolunteers = volCount.data().count;

        // 3. Resolved This Month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        let resolvedThisMonth = 0;
        try {
            // Try the efficient way first
            const resolvedCount = await db.collection("needs")
                .where("status", "==", "completed")
                .where("created_at", ">=", firstDayOfMonth)
                .count()
                .get();
            resolvedThisMonth = resolvedCount.data().count;
        } catch (indexError) {
            console.warn("Index not ready yet, falling back to in-memory filter...");
            // Fallback: Fetch all completed needs and filter in JS (good for hackathon demos)
            const snapshot = await db.collection("needs")
                .where("status", "==", "completed")
                .get();
            
            resolvedThisMonth = snapshot.docs.filter(doc => {
                const createdAt = doc.data().created_at;
                return createdAt && createdAt >= firstDayOfMonth;
            }).length;
        }

        return NextResponse.json({
            stats: {
                totalNeeds: totalNeeds || 0,
                totalVolunteers: totalVolunteers || 0,
                resolvedThisMonth: resolvedThisMonth || 0,
                livesImpacted: (resolvedThisMonth || 0) * 4
            }
        });
    } catch (error: any) {
        console.error("Impact Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
