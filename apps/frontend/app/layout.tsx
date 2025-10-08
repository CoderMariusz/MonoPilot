import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "Forza MES",
  description: "Manufacturing Execution System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
