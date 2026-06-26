"use client";

import { usePathname } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";

type AdminLayoutClientProps = {
  children: React.ReactNode;
};

export function AdminLayoutClient({
  children,
}: AdminLayoutClientProps) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}

export default AdminLayoutClient;