"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";

export type Role = "coordinator" | "field_staff";

export interface AuthUser {
    email: string;
    role: Role;
}

interface AuthContextValue {
    user: AuthUser | null;
    login: (role: Role) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DUMMY_EMAIL = "admin@involun.org";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const login = useCallback((role: Role) => {
        setUser({ email: DUMMY_EMAIL, role });
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
