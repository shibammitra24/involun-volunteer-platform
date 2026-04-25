import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const identifier = searchParams.get("identifier");

        if (!identifier) {
            return NextResponse.json({ error: "identifier is required" }, { status: 400 });
        }

        // 1. Find the volunteer document by name or email (Case-insensitive support)
        let volSnapshot = await db.collection("volunteers")
            .where("name", "==", identifier)
            .limit(1)
            .get();

        // Fallback to lowercase name check if exact match fails
        if (volSnapshot.empty) {
            volSnapshot = await db.collection("volunteers")
                .where("email", "==", identifier)
                .limit(1)
                .get();
        }

        // Deep search fallback for demo flexibility (name case-insensitive)
        if (volSnapshot.empty) {
            const allVolunteers = await db.collection("volunteers").get();
            const found = allVolunteers.docs.find(doc => {
                const data = doc.data();
                const name = data.name?.toLowerCase() || "";
                const email = data.email?.toLowerCase() || "";
                const search = identifier.toLowerCase();
                return name === search || email === search || name.includes(search);
            });
            
            if (found) {
                // Mock a snapshot-like structure for the rest of the logic
                const volunteerId = found.id;
                const snapshot = await db.collection("assignments")
                    .where("volunteer_id", "==", volunteerId)
                    .get();

                const assignments = await Promise.all(snapshot.docs.map(async (doc) => {
                    const data = doc.data();
                    const needDoc = await db.collection("needs").doc(data.need_id).get();
                    return {
                        id: doc.id,
                        ...data,
                        needs: needDoc.exists ? { id: needDoc.id, ...needDoc.data() } : null
                    };
                }));

                return NextResponse.json({
                    success: true,
                    assignments: assignments,
                    volunteer: { id: volunteerId, ...found.data() }
                });
            }
        }

        if (volSnapshot.empty) {
            return NextResponse.json({ assignments: [] });
        }

        const volunteerId = volSnapshot.docs[0].id;

        // 2. Get assignments for this volunteer
        const snapshot = await db.collection("assignments")
            .where("volunteer_id", "==", volunteerId)
            .get();

        const assignments = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const needDoc = await db.collection("needs").doc(data.need_id).get();
            return {
                id: doc.id,
                ...data,
                needs: needDoc.exists ? { id: needDoc.id, ...needDoc.data() } : null
            };
        }));

        return NextResponse.json({
            success: true,
            assignments: assignments,
            volunteer: { id: volunteerId, ...volSnapshot.docs[0].data() }
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Get Volunteer Assignments API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
