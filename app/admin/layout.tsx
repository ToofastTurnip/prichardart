import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio | Prichard Art",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-linen">{children}</div>;
}
