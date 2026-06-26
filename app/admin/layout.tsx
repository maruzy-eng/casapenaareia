import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}