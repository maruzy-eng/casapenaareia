export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";

import { AdminProfileClient } from "@/components/admin/admin-profile-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProfileDatabaseRow = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  role?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
};

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
};

export default async function AdminProfilePage() {
  /*
   * Usa o cliente SSR para identificar o usuário autenticado
   * através dos cookies atuais do Supabase.
   */
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login?redirect=/admin/perfil");
  }

  /*
   * Usa o service role apenas no servidor para carregar os dados
   * complementares da tabela profiles.
   *
   * Usamos select("*") para impedir que uma coluna opcional ainda
   * ausente no cache do Supabase provoque o redirecionamento.
   */
  const adminClient = createAdminClient();

  const {
    data: profileData,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Erro ao carregar public.profiles:", {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
      userId: user.id,
    });
  }

  const profile = (profileData || null) as ProfileDatabaseRow | null;

  /*
   * Não redireciona mais para o dashboard quando existir um erro
   * em um campo opcional.
   *
   * Dados do Supabase Auth são usados como fallback.
   */
  const normalizedProfile: AdminProfile = {
    id: profile?.id || user.id,

    name:
      profile?.name?.trim() ||
      String(user.user_metadata?.name || "").trim() ||
      String(user.user_metadata?.full_name || "").trim() ||
      user.email?.split("@")[0] ||
      "Administrador",

    email:
      profile?.email?.trim() ||
      user.email ||
      "",

    phone:
      profile?.phone?.trim() ||
      String(user.phone || "").trim() ||
      null,

    avatar_url:
      profile?.avatar_url?.trim() ||
      String(user.user_metadata?.avatar_url || "").trim() ||
      null,

    role:
      profile?.role?.trim() ||
      String(user.user_metadata?.role || "").trim() ||
      "admin",

    created_at:
      profile?.created_at ||
      user.created_at ||
      new Date().toISOString(),

    updated_at:
      profile?.updated_at ||
      user.updated_at ||
      null,

    last_login_at:
      profile?.last_login_at ||
      user.last_sign_in_at ||
      null,
  };

  return (
    <main className="w-full min-w-0">
      {profileError ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Alguns dados complementares do perfil não puderam ser carregados.
          Seus dados de autenticação continuam disponíveis.
        </div>
      ) : null}

      {!profile ? (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          O usuário está autenticado, mas não foi encontrado um registro
          correspondente na tabela <strong>profiles</strong>.
        </div>
      ) : null}

      <AdminProfileClient admin={normalizedProfile} />
    </main>
  );
}