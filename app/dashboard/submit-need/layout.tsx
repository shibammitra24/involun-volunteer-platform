import { Metadata } from "next";

export const metadata: Metadata = {
    title: "InVolun | Report a Need",
    description: "Submit a new community need for AI analysis and volunteer matching.",
};

export default function SubmitNeedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
