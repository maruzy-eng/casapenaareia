import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const allowedRoles = [
  "admin",
  "administrator",
  "manager",
  "editor",
];

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sessão inválida. Faça login novamente.",
        },
        {
          status: 401,
        }
      );
    }

    const adminClient = createAdminClient();

    const { data: profile, error: profileError } =
      await adminClient
        .from("profiles")
        .select("id, name, email, role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Erro ao validar perfil administrativo:",
        profileError
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Não foi possível validar seu acesso administrativo.",
        },
        {
          status: 500,
        }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esta conta não possui um perfil administrativo.",
        },
        {
          status: 403,
        }
      );
    }

    const normalizedRole = String(profile.role || "")
      .trim()
      .toLowerCase();

    if (!allowedRoles.includes(normalizedRole)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esta conta não possui permissão para acessar o painel.",
        },
        {
          status: 403,
        }
      );
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.warn(
        "Não foi possível atualizar último acesso:",
        updateError
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error(
      "Erro inesperado ao validar acesso administrativo:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Não foi possível validar seu acesso administrativo.",
      },
      {
        status: 500,
      }
    );
  }
}