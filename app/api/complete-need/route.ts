import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { need_id } = await req.json();

        if (!need_id) {
            return NextResponse.json({ error: "need_id is required" }, { status: 400 });
        }

        await db.runTransaction(async (transaction) => {
            const needRef = db.collection("needs").doc(need_id);
            
            // 1. Fetch assignments for this need
            const assignmentsSnapshot = await transaction.get(
                db.collection("assignments").where("need_id", "==", need_id)
            );

            const volunteerIds = assignmentsSnapshot.docs.map(doc => doc.data().volunteer_id);

            // 2. Update Need Status
            transaction.update(needRef, { status: "completed" });

            // 3. Update Assignments Status
            assignmentsSnapshot.docs.forEach(doc => {
                transaction.update(doc.ref, { status: "completed" });
            });

            // 4. Free up Volunteers
            for (const vId of volunteerIds) {
                const volRef = db.collection("volunteers").doc(vId);
                transaction.update(volRef, { is_available: true });
            }
        });

        return NextResponse.json({
            success: true,
            message: "Need and assignments marked as completed. Volunteers are now available.",
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Complete Need API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
