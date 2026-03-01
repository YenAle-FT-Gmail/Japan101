import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Japan GOV-OS — Navigate Japanese Bureaucracy in English",
  description:
    "A unified English-language wrapper for Japanese digital government services. Moving, taxes, visa, health insurance — simplified.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white min-h-screen`}
      >
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-slate-800 mt-20">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-slate-500">
            <p>
              Japan GOV-OS is a <strong>guidance tool</strong> only. Final submissions are made on official{" "}
              <span className="text-slate-400">.go.jp</span> sites.
            </p>
            <p className="mt-1">
              Compliant with Administrative Scrivener Law Article 19 (2026 Revision).
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
