import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const need_id = searchParams.get("need_id");

        if (!need_id) {
            return NextResponse.json({ error: "need_id is required" }, { status: 400 });
        }

        // 1. Get all interests for this need
        const interestsSnapshot = await db.collection("interests")
            .where("need_id", "==", need_id)
            .get();

        if (interestsSnapshot.empty) {
            return NextResponse.json({ success: true, volunteers: [] });
        }

        // 2. Fetch volunteer details for each interest
        const volunteerPromises = interestsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const volDoc = await db.collection("volunteers").doc(data.volunteer_id).get();
            if (volDoc.exists) {
                return {
                    id: volDoc.id,
                    ...volDoc.data(),
                    interest_id: doc.id,
                    created_at: data.created_at
                };
            }
            return null;
        });

        const volunteers = (await Promise.all(volunteerPromises)).filter(v => v !== null);

        return NextResponse.json({ success: true, volunteers });
    } catch (err: any) {
        console.error("Get Interested Volunteers Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
