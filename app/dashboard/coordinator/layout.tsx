import { Metadata } from "next";

export const metadata: Metadata = {
    title: "InVolun | Coordinator Dashboard",
    description: "Manage community needs and volunteer assignments.",
};

export default function CoordinatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
