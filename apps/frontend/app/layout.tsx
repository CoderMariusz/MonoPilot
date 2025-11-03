import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { ToastProvider } from "@/lib/toast";
import { AuthProvider } from "@/lib/auth/AuthContext";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="cleanup-nextjs-portal" strategy="afterInteractive">
          {`
            (function() {
              function cleanup() {
                const portals = document.querySelectorAll('nextjs-portal');
                portals.forEach((portal) => portal.remove());
              }
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', cleanup);
              } else {
                cleanup();
              }
              setTimeout(cleanup, 100);
              setInterval(cleanup, 1000);
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <AppLayout>{children}</AppLayout>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
