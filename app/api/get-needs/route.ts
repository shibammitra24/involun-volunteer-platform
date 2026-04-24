import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();

        const { data, error } = await supabase
            .from("needs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase Error (Get Needs):", error);
            return NextResponse.json(
                { error: "Database error", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            needs: data,
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
