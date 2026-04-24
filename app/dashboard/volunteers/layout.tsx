import { Metadata } from "next";

export const metadata: Metadata = {
    title: "InVolun | Volunteer Network",
    description: "Browse and manage the directory of registered volunteers.",
};

export default function VolunteersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
