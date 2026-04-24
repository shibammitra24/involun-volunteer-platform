import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { need_id, volunteer_id, reason } = await req.json();

        if (!need_id || !volunteer_id) {
            return NextResponse.json(
                { error: "need_id and volunteer_id are required" },
                { status: 400 },
            );
        }

        // Use a transaction for atomic updates
        await db.runTransaction(async (transaction) => {
            const needRef = db.collection("needs").doc(need_id);
            const volunteerRef = db.collection("volunteers").doc(volunteer_id);
            const assignmentRef = db.collection("assignments").doc(); // Auto ID

            // 1. Create the assignment
            transaction.set(assignmentRef, {
                need_id,
                volunteer_id,
                ai_reason: reason,
                status: "pending",
                created_at: new Date().toISOString(),
            });

            // 2. Update the need status
            transaction.update(needRef, { status: "assigned" });

            // 3. Update the volunteer availability
            transaction.update(volunteerRef, { is_available: false });
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Assignment API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
