import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("volunteers")
            .insert({
                name,
                email,
                skills, // Expected to be an array of strings
                availability, // Expected to be a string
                location,
                is_available: true,
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Error (Volunteer Registration):", error);
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: "This email is already registered" },
                    { status: 400 },
                );
            }
            return NextResponse.json(
                { error: "Database error", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            volunteer: data,
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
