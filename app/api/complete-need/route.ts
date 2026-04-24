import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
    try {
        const { need_id } = await req.json();

        if (!need_id) {
            return NextResponse.json({ error: "need_id is required" }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        // 1. Fetch all assignments for this need to get the volunteer IDs
        const { data: assignments, error: fetchError } = await supabase
            .from("assignments")
            .select("volunteer_id")
            .eq("need_id", need_id);

        if (fetchError) throw fetchError;

        const volunteerIds = assignments?.map(a => a.volunteer_id) || [];

        // 2. Perform updates in a sequence (or ideally a transaction/RPC)
        // Update Need Status
        const { error: needError } = await supabase
            .from("needs")
            .update({ status: "completed" })
            .eq("id", need_id);
        
        if (needError) throw needError;

        // Update Assignments Status
        const { error: assignError } = await supabase
            .from("assignments")
            .update({ status: "completed" })
            .eq("need_id", need_id);
        
        if (assignError) throw assignError;

        // Free up Volunteers
        if (volunteerIds.length > 0) {
            const { error: volError } = await supabase
                .from("volunteers")
                .update({ is_available: true })
                .in("id", volunteerIds);
            
            if (volError) throw volError;
        }

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
