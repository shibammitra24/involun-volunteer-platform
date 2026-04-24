import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch all volunteers
        const volunteersSnapshot = await db.collection("volunteers")
            .orderBy("created_at", "desc")
            .get();

        const volunteers = volunteersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            assignments: [] as any[]
        }));

        // 2. Fetch all assignments
        const assignmentsSnapshot = await db.collection("assignments").get();
        const allAssignments = assignmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 3. Fetch all needs (to resolve need details in assignments)
        const needsSnapshot = await db.collection("needs").get();
        const needsMap = new Map();
        needsSnapshot.docs.forEach(doc => {
            needsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // 4. Map assignments to volunteers
        const typedAssignments = allAssignments as any[];
        volunteers.forEach(v => {
            v.assignments = typedAssignments
                .filter(a => a.volunteer_id === v.id)
                .map(a => ({
                    ...a,
                    needs: needsMap.get(a.need_id) || null
                }));
        });

        return NextResponse.json({
            success: true,
            volunteers: volunteers,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Get Volunteers API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
