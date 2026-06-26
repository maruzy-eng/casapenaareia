export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";

import { UsersCrudClient } from "@/components/admin/users-crud-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminUserItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login?redirect=/admin/usuarios");
  }

  const adminClient = createAdminClient();

  const { data: currentProfile, error: currentProfileError } =
    await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

  if (currentProfileError || !currentProfile) {
    redirect("/admin/dashboard");
  }

  const currentRole = String(
    currentProfile.role || ""
  ).toLowerCase();

  if (!["admin", "administrator"].includes(currentRole)) {
    redirect("/admin/dashboard");
  }

  const { data: users, error: usersError } = await adminClient
    .from("profiles")
    .select(
      `
        id,
        name,
        email,
        phone,
        role,
        avatar_url,
        created_at,
        updated_at,
        last_login_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  if (usersError) {
    throw new Error(usersError.message);
  }

  return (
    <UsersCrudClient
      initialUsers={(users || []) as AdminUserItem[]}
      currentUserId={user.id}
    />
  );
}