import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();

        // Fetch all volunteers with their assignments and the associated needs
        const { data, error } = await supabase
            .from("volunteers")
            .select(`
                *,
                assignments (
                    id,
                    status,
                    created_at,
                    needs (
                        id,
                        title,
                        status,
                        category,
                        location
                    )
                )
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase Error (Get Volunteers):", error);
            return NextResponse.json(
                { error: "Database error", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            volunteers: data,
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
