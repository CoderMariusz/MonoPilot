import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NPD Dashboard - Forza MES",
  description: "New Product Development Pipeline - Stage-Gate Workflow",
};

/**
 * NPD Module Layout
 *
 * Provides metadata for NPD routes.
 * Innovation Light theme (gray-50 background, blue-500 primary) applied via page components.
 *
 * @since Story NPD-1.3
 */
export default function NPDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
