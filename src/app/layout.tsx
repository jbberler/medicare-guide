import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WizardShell } from "@/components/wizard/WizardShell";
import { WizardAppShell } from "@/components/wizard/WizardAppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medicare Guidepost",
  description:
    "A guided decision tool to help you choose the right Medicare coverage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-base">
        <WizardShell>
          <WizardAppShell>{children}</WizardAppShell>
        </WizardShell>

        {/* Footer — static, outside wizard state */}
        <footer className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500 print:hidden">
          Rates current for 2026 · Last updated March 2026
        </footer>
      </body>
    </html>
  );
}
