import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HARDO — Land Your IB Offer",
  description: "AI-powered Investment Banking mock interview platform"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
