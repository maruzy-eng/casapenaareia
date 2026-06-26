"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Home,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginLoading />}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawRedirectTo = searchParams.get("redirect");

  const redirectTo =
    !rawRedirectTo ||
    rawRedirectTo === "/admin" ||
    rawRedirectTo === "/admin/"
      ? "/admin/dashboard"
      : rawRedirectTo;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        setErrorMessage("Preencha o e-mail e a senha.");
        return;
      }

      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error || !data.user) {
        setErrorMessage("E-mail ou senha inválidos.");
        return;
      }

      const validationResponse = await fetch(
        "/api/admin/auth/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const validationData = await validationResponse.json();

      if (!validationResponse.ok || !validationData?.ok) {
        await supabase.auth.signOut();

        setErrorMessage(
          validationData?.message ||
            "Esta conta não possui permissão administrativa."
        );

        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      console.error("Erro inesperado no login:", error);

      setErrorMessage(
        "Não foi possível entrar no painel. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-login-page relative min-h-screen overflow-hidden bg-[#071e23] px-5 py-8 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#27b4c4]/16 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#0f7f8c]/18 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.24) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/8 to-transparent" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.055] shadow-[0_34px_120px_rgba(0,0,0,.35)] backdrop-blur-2xl lg:grid-cols-[1fr_480px]">
          <div className="hidden min-h-[680px] flex-col justify-between border-r border-white/10 bg-white/[0.035] p-10 lg:flex">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#27b4c4] text-[#052f35] shadow-[0_16px_40px_rgba(39,180,196,.24)]">
                  <Home className="h-7 w-7" strokeWidth={2} />
                </div>

                <div>
                  <p className="text-lg font-semibold text-white">
                    Casa Pé n&apos;Areia
                  </p>

                  <p className="text-sm text-white/45">
                    Reservation OS
                  </p>
                </div>
              </div>

              <div className="mt-24 max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#65d3de]">
                  Admin panel
                </p>

                <h1 className="mt-5 text-5xl font-semibold leading-[1.04] tracking-[-0.07em] text-white">
                  Gerencie reservas com mais clareza.
                </h1>

                <p className="mt-6 max-w-lg text-base leading-8 text-white/56">
                  Acesse o painel para acompanhar reservas,
                  hóspedes, acomodações, pagamentos e operações da
                  casa de hóspedes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-2xl font-semibold text-white">
                  24h
                </p>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Controle da operação
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-2xl font-semibold text-white">
                  OS
                </p>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Sistema interno
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="text-2xl font-semibold text-white">
                  SSL
                </p>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Acesso protegido
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[640px] items-center justify-center p-5 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="text-center lg:hidden">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/[0.08] shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-xl">
                  <Home className="h-7 w-7 text-[#27b4c4]" />
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-[#65d3de]">
                  Casa Pé n&apos;Areia
                </p>
              </div>

              <div className="text-center lg:text-left">
                <div className="mx-auto hidden h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/[0.08] shadow-[0_18px_50px_rgba(0,0,0,.28)] backdrop-blur-xl lg:flex lg:mx-0">
                  <LockKeyhole className="h-7 w-7 text-[#27b4c4]" />
                </div>

                <p className="mt-6 hidden text-xs font-semibold uppercase tracking-[0.28em] text-[#65d3de] lg:block">
                  Acesso administrativo
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
                  Entrar no painel
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-white/55 lg:mx-0">
                  Use seu e-mail e senha para acessar o sistema
                  administrativo.
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                autoComplete="off"
                className="mt-8 space-y-5"
              >
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                    E-mail
                  </span>

                  <div className="flex min-h-13 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 transition focus-within:border-[#27b4c4]/60 focus-within:bg-white/[0.09] focus-within:ring-4 focus-within:ring-[#27b4c4]/10">
                    <Mail className="h-4 w-4 shrink-0 text-white/40" />

                    <input
                      type="email"
                      required
                      name="admin_login_email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setErrorMessage("");
                      }}
                      autoComplete="off"
                      inputMode="email"
                      spellCheck={false}
                      className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/25"
                      placeholder="admin@email.com"
                    />
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                    Senha
                  </span>

                  <div className="flex min-h-13 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 transition focus-within:border-[#27b4c4]/60 focus-within:bg-white/[0.09] focus-within:ring-4 focus-within:ring-[#27b4c4]/10">
                    <LockKeyhole className="h-4 w-4 shrink-0 text-white/40" />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      name="admin_login_password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrorMessage("");
                      }}
                      autoComplete="new-password"
                      spellCheck={false}
                      className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/25"
                      placeholder="••••••••"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/[0.07] hover:text-white"
                      aria-label={
                        showPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </label>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="admin-login-submit-button inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-[#27b4c4] bg-[#27b4c4] px-6 text-sm font-semibold text-[#052f35] shadow-[0_16px_36px_rgba(39,180,196,.22)] transition hover:border-[#4bc7d4] hover:bg-[#4bc7d4] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: "#27b4c4",
                    borderColor: "#27b4c4",
                    color: "#052f35",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Entrar no painel
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-xs text-white/35">
                <ShieldCheck className="h-4 w-4" />
                <span>Acesso protegido pelo Supabase Auth</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .admin-login-page input,
        .admin-login-page textarea,
        .admin-login-page select,
        .admin-login-page button {
          outline: none !important;
        }

        .admin-login-page input:focus,
        .admin-login-page textarea:focus,
        .admin-login-page select:focus,
        .admin-login-page button:focus {
          outline: none !important;
        }

        .admin-login-page input:focus-visible,
        .admin-login-page textarea:focus-visible,
        .admin-login-page select:focus-visible,
        .admin-login-page button:focus-visible {
          outline: none !important;
        }

        .admin-login-page input:-webkit-autofill,
        .admin-login-page input:-webkit-autofill:hover,
        .admin-login-page input:-webkit-autofill:focus,
        .admin-login-page input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.07) inset !important;
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.07) inset !important;
          border-radius: 1rem !important;
          background-color: transparent !important;
          background-image: none !important;
          transition:
            background-color 999999s ease-in-out 0s,
            color 999999s ease-in-out 0s !important;
        }

        .admin-login-submit-button,
        .admin-login-submit-button:visited {
          background: #27b4c4 !important;
          border-color: #27b4c4 !important;
          color: #052f35 !important;
          text-decoration: none !important;
        }

        .admin-login-submit-button:hover,
        .admin-login-submit-button:focus,
        .admin-login-submit-button:active {
          background: #4bc7d4 !important;
          border-color: #4bc7d4 !important;
          color: #052f35 !important;
          text-decoration: none !important;
        }

        .admin-login-submit-button svg {
          stroke: #052f35 !important;
        }
      `}</style>
    </main>
  );
}

function AdminLoginLoading() {
  return (
    <main className="admin-login-page relative min-h-screen overflow-hidden bg-[#071e23] px-5 py-8 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#27b4c4]/16 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#0f7f8c]/18 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.055] shadow-[0_34px_120px_rgba(0,0,0,.35)] backdrop-blur-2xl lg:grid-cols-[1fr_480px]">
          <div className="hidden min-h-[680px] bg-white/[0.035] p-10 lg:block">
            <div className="h-14 w-48 rounded-2xl bg-white/10" />
            <div className="mt-24 h-4 w-44 rounded-full bg-white/10" />
            <div className="mt-6 h-14 w-full rounded-full bg-white/10" />
            <div className="mt-4 h-14 w-3/4 rounded-full bg-white/10" />
          </div>

          <div className="flex min-h-[640px] items-center justify-center p-5 sm:p-8 lg:p-10">
            <div className="w-full max-w-md animate-pulse">
              <div className="h-16 w-16 rounded-[1.4rem] bg-white/[0.08]" />
              <div className="mt-6 h-3 w-44 rounded-full bg-white/[0.08]" />
              <div className="mt-4 h-9 w-64 rounded-full bg-white/[0.08]" />
              <div className="mt-4 h-4 w-full max-w-sm rounded-full bg-white/[0.06]" />

              <div className="mt-8 space-y-5">
                <div>
                  <div className="mb-2 h-3 w-16 rounded-full bg-white/[0.08]" />
                  <div className="h-13 rounded-2xl bg-white/[0.08]" />
                </div>

                <div>
                  <div className="mb-2 h-3 w-16 rounded-full bg-white/[0.08]" />
                  <div className="h-13 rounded-2xl bg-white/[0.08]" />
                </div>

                <div className="h-13 rounded-2xl bg-[#27b4c4]/25" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}