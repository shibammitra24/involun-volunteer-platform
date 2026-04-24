import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { name, email, skills, availability, location } = await req.json();

        // Validation
        if (!name || !email) {
            return NextResponse.json(
                { error: "Name and Email are required" },
                { status: 400 },
            );
        }

        // Check if email already exists
        const existing = await db.collection("volunteers")
            .where("email", "==", email)
            .get();
        
        if (!existing.empty) {
            return NextResponse.json(
                { error: "This email is already registered" },
                { status: 400 },
            );
        }

        const volunteerData = {
            name,
            email,
            skills, // Expected to be an array of strings
            availability, // Expected to be a string
            location,
            is_available: true,
            created_at: new Date().toISOString(),
        };

        const docRef = await db.collection("volunteers").add(volunteerData);
        const savedVolunteer = { id: docRef.id, ...volunteerData };

        return NextResponse.json({
            success: true,
            volunteer: savedVolunteer,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Volunteer Registration API Error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: message },
            { status: 500 },
        );
    }
}
