import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MonoPilot2",
  description: "MonoPilot2 Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
