import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { db } from "../lib/firebase-admin.js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
    console.log("🚀 Starting migration from Supabase to Firestore...");

    try {
        // 1. Migrate Needs
        console.log("--- Migrating Needs ---");
        const { data: needs, error: nError } = await supabase.from("needs").select("*");
        if (nError) throw nError;
        
        for (const need of needs) {
            const { id, ...data } = need;
            await db.collection("needs").doc(id).set({
                ...data,
                created_at: data.created_at || new Date().toISOString()
            });
            console.log(`✅ Migrated Need: ${id}`);
        }

        // 2. Migrate Volunteers
        console.log("\n--- Migrating Volunteers ---");
        const { data: volunteers, error: vError } = await supabase.from("volunteers").select("*");
        if (vError) throw vError;

        for (const vol of volunteers) {
            const { id, ...data } = vol;
            await db.collection("volunteers").doc(id).set({
                ...data,
                created_at: data.created_at || new Date().toISOString()
            });
            console.log(`✅ Migrated Volunteer: ${id}`);
        }

        // 3. Migrate Assignments
        console.log("\n--- Migrating Assignments ---");
        const { data: assignments, error: aError } = await supabase.from("assignments").select("*");
        if (aError) throw aError;

        for (const assign of assignments) {
            const { id, ...data } = assign;
            await db.collection("assignments").doc(id).set({
                ...data,
                created_at: data.created_at || new Date().toISOString()
            });
            console.log(`✅ Migrated Assignment: ${id}`);
        }

        console.log("\n🎉 Migration completed successfully!");
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
    }
}

migrate();
