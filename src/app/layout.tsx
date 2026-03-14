import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lang4Diagnosis",
  description:
    "Analyze English texts for research-based depression-related linguistic markers."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

