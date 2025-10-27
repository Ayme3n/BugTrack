import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BugTrack - Security Research Workflow Platform",
  description: "Manage targets, findings, payloads, and run security tools from your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

