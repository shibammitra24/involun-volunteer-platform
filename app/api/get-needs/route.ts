import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    try {
        const snapshot = await db.collection("needs")
            .orderBy("created_at", "desc")
            .get();

        const needs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure created_at is a string if it's a Firestore Timestamp
            created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
        }));

        return NextResponse.json({
            success: true,
            needs: needs,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Get Needs API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
