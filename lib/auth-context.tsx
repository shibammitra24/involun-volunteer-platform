"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";

export type Role = "coordinator" | "field_staff" | "volunteer";

export interface AuthUser {
    email: string;
    role: Role;
    name?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (role: Role, name?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DUMMY_EMAIL = "admin@involun.org";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("involun_user");
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved user", e);
                localStorage.removeItem("involun_user");
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((role: Role, name?: string) => {
        const newUser = { 
            email: name ? `${name.toLowerCase().replace(/\s+/g, '.')}@involun.org` : DUMMY_EMAIL, 
            role,
            name 
        };
        setUser(newUser);
        localStorage.setItem("involun_user", JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem("involun_user");
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
