import { Metadata } from "next";

export const metadata: Metadata = {
    title: "InVolun | Secure Login",
    description: "Access the InVolun volunteer coordination platform.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
