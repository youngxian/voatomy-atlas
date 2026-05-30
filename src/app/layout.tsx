import type { Metadata } from "next";
import { PlanProvider } from "@/lib/plan";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATLAS — AI Sprint Intelligence Layer",
  description: "Your board, but with 87% sprint accuracy. By Voatomy Labs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider>
          <PlanProvider>{children}</PlanProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
