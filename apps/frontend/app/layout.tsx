import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { ToastProvider } from "@/lib/toast";

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
        <ToastProvider>
          <AppLayout>{children}</AppLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
