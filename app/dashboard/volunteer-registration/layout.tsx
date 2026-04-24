import { Metadata } from "next";

export const metadata: Metadata = {
    title: "InVolun | Volunteer Registration",
    description: "Join the InVolun network and start helping your community.",
};

export default function VolunteerRegistrationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
