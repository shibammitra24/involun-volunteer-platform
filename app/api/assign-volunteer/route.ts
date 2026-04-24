import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {
        const { need_id, volunteer_id, reason } = await req.json();

        if (!need_id || !volunteer_id) {
            return NextResponse.json(
                { error: "need_id and volunteer_id are required" },
                { status: 400 },
            );
        }

        const supabase = createServerSupabaseClient();

        // 1. Create the assignment
        const { error: assignError } = await supabase
            .from("assignments")
            .insert({
                need_id,
                volunteer_id,
                ai_reason: reason,
                status: "pending", // Dashboard requirement said status changes to Assigned, 
                                 // but assignments table has 'pending' | 'accepted' | etc.
                                 // I'll stick to the schema's 'pending' for the assignment record itself.
            });

        if (assignError) {
            console.error("Assignment Insert Error:", assignError);
            return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
        }

        // 2. Update the need status
        const { error: needError } = await supabase
            .from("needs")
            .update({ status: "assigned" })
            .eq("id", need_id);

        if (needError) {
            console.error("Need Update Error:", needError);
            return NextResponse.json({ error: "Failed to update need status" }, { status: 500 });
        }

        // 3. Update the volunteer availability
        const { error: volunteerError } = await supabase
            .from("volunteers")
            .update({ is_available: false })
            .eq("id", volunteer_id);

        if (volunteerError) {
            console.error("Volunteer Update Error:", volunteerError);
            return NextResponse.json({ error: "Failed to update volunteer availability" }, { status: 500 });
        }

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
