import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { need_id, volunteer_id } = await req.json();

        if (!need_id || !volunteer_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if already interested
        const existing = await db.collection("interests")
            .where("need_id", "==", need_id)
            .where("volunteer_id", "==", volunteer_id)
            .get();

        if (!existing.empty) {
            return NextResponse.json({ success: true, message: "Interest already recorded" });
        }

        await db.collection("interests").add({
            need_id,
            volunteer_id,
            created_at: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Record Interest Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
