import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const needId = searchParams.get("need_id");

        if (!needId) {
            return NextResponse.json({ error: "need_id is required" }, { status: 400 });
        }

        const snapshot = await db.collection("assignments")
            .where("need_id", "==", needId)
            .get();

        const assignments = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const volDoc = await db.collection("volunteers").doc(data.volunteer_id).get();
            return {
                id: doc.id,
                ...data,
                volunteers: volDoc.exists ? { id: volDoc.id, ...volDoc.data() } : null
            };
        }));

        return NextResponse.json({
            success: true,
            assignments: assignments,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Get Assignments API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
