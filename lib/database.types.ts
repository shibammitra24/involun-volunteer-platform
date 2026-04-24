// ============================================================
// Database types — mirrors the Supabase schema
// ============================================================

// --- Enums ---------------------------------------------------

export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type NeedStatus = "open" | "assigned" | "completed";
export type AssignStatus = "pending" | "accepted" | "rejected" | "completed";

// --- Row types -----------------------------------------------

export interface Need {
    id: string;
    title: string;
    raw_description: string;
    ai_summary: string | null;
    urgency: UrgencyLevel;
    category: string | null;
    location: string | null;
    status: NeedStatus;
    created_at: string;
}

export interface Volunteer {
    id: string;
    name: string;
    email: string;
    skills: string[];
    availability: string | null;
    location: string | null;
    is_available: boolean;
    created_at: string;
}

export interface Assignment {
    id: string;
    need_id: string;
    volunteer_id: string;
    ai_reason: string | null;
    status: AssignStatus;
    created_at: string;
}

// --- Insert types (omit server-generated fields) -------------

export type NeedInsert = Omit<Need, "id" | "created_at"> &
    Partial<Pick<Need, "id" | "created_at">>;

export type VolunteerInsert = Omit<Volunteer, "id" | "created_at"> &
    Partial<Pick<Volunteer, "id" | "created_at">>;

export type AssignmentInsert = Omit<Assignment, "id" | "created_at"> &
    Partial<Pick<Assignment, "id" | "created_at">>;

// --- Update types (everything optional except id) ------------

export type NeedUpdate = Partial<Omit<Need, "id">> & Pick<Need, "id">;
export type VolunteerUpdate = Partial<Omit<Volunteer, "id">> &
    Pick<Volunteer, "id">;
export type AssignmentUpdate = Partial<Omit<Assignment, "id">> &
    Pick<Assignment, "id">;

// --- Supabase Database type definition -----------------------

export interface Database {
    public: {
        Tables: {
            needs: {
                Row: Need;
                Insert: NeedInsert;
                Update: NeedUpdate;
            };
            volunteers: {
                Row: Volunteer;
                Insert: VolunteerInsert;
                Update: VolunteerUpdate;
            };
            assignments: {
                Row: Assignment;
                Insert: AssignmentInsert;
                Update: AssignmentUpdate;
            };
        };
    };
}
