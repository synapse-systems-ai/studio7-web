import { AdminGate } from "./admin-gate";

export const instant = false;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
