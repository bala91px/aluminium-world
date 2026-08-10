import type { Metadata } from "next";
import "./globals.css";
import { t } from "@/lib/strings";

export const metadata: Metadata = {
  title: `${t.appName} — ${t.tagline}`,
  description: "Job-flow prototype for Aluminium World, Kalpetta.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
