"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  ChevronDown,
  Home,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  LogOut,
  Mail,
  MapIcon,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AdminShellProps = {
  children: React.ReactNode;
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Reservas",
    href: "/admin/reservas",
    icon: CalendarDays,
  },
  {
    label: "Check-in/out",
    href: "/admin/checkins-checkouts",
    icon: LogOut,
  },
  {
    label: "Hóspedes",
    href: "/admin/hospedes",
    icon: Users,
  },
  {
    label: "Acomodações",
    href: "/admin/acomodacoes",
    icon: BedDouble,
  },
  {
    label: "Calendário",
    href: "/admin/calendario",
    icon: CalendarDays,
  },
  {
    label: "Tarifas",
    href: "/admin/tarifas",
    icon: WalletCards,
  },
  {
    label: "Upgrades",
    href: "/admin/upgrades",
    icon: Sparkles,
  },
  {
    label: "Bloqueios",
    href: "/admin/bloqueios",
    icon: LockKeyhole,
  },
  {
    label: "Mapa",
    href: "/admin/mapa-reservas",
    icon: MapIcon,
  },
  {
    label: "Financeiro",
    href: "/admin/financeiro",
    icon: WalletCards,
  },
  {
    label: "Emails",
    href: "/admin/emails",
    icon: Mail,
  },
  {
    label: "Automações",
    href: "/admin/automacoes",
    icon: PlugZap,
  },
  {
    label: "Links",
    href: "/admin/links",
    icon: Link2,
  },
];

const administrationItems: MenuItem[] = [
  {
    label: "Usuários",
    href: "/admin/usuarios",
    icon: Users,
  },
];

function getPageTitle(pathname: string) {
  if (pathname.includes("/admin/perfil")) return "Meu perfil";
  if (pathname.includes("/admin/usuarios")) return "Usuários";
  if (pathname.includes("/admin/reservas")) return "Reservas";

  if (pathname.includes("/admin/checkins-checkouts")) {
    return "Check-in/out";
  }

  if (pathname.includes("/admin/hospedes")) return "Hóspedes";
  if (pathname.includes("/admin/acomodacoes")) return "Acomodações";
  if (pathname.includes("/admin/calendario")) return "Calendário";
  if (pathname.includes("/admin/tarifas")) return "Tarifas";
  if (pathname.includes("/admin/upgrades")) return "Upgrades";
  if (pathname.includes("/admin/bloqueios")) return "Bloqueios";

  if (pathname.includes("/admin/mapa-reservas")) {
    return "Mapa de reservas";
  }

  if (pathname.includes("/admin/financeiro")) return "Financeiro";
  if (pathname.includes("/admin/emails")) return "Emails";

  if (pathname.includes("/admin/automacoes")) {
    return "Automações";
  }

  if (pathname.includes("/admin/links")) return "Links";

  if (pathname.includes("/admin/configuracoes")) {
    return "Configurações";
  }

  return "Dashboard";
}

function getPageSubtitle(pathname: string) {
  if (pathname.includes("/admin/perfil")) {
    return "Atualize seus dados, foto e configurações de segurança.";
  }

  if (pathname.includes("/admin/usuarios")) {
    return "Gerencie acessos, funções, permissões e usuários administrativos.";
  }

  if (pathname.includes("/admin/tarifas")) {
    return "Gerencie temporadas, datas especiais, feriados e regras de preço.";
  }

  if (pathname.includes("/admin/upgrades")) {
    return "Gerencie extras opcionais e onde eles aparecem no fluxo de reserva.";
  }

  if (pathname.includes("/admin/automacoes")) {
    return "Gerencie webhooks para pagamentos, check-in, checkout e reservas.";
  }

  if (pathname.includes("/admin/financeiro")) {
    return "Acompanhe entradas, receitas, pendências e desempenho financeiro.";
  }

  if (pathname.includes("/admin/emails")) {
    return "Gerencie mensagens recebidas e emails enviados pelo painel.";
  }

  if (pathname.includes("/admin/mapa-reservas")) {
    return "Visualize reservas e bloqueios por acomodação.";
  }

  if (pathname.includes("/admin/calendario")) {
    return "Veja reservas e bloqueios em formato de calendário.";
  }

  if (pathname.includes("/admin/bloqueios")) {
    return "Gerencie períodos indisponíveis por acomodação.";
  }

  if (pathname.includes("/admin/reservas")) {
    return "Gerencie reservas, hóspedes, pagamentos e períodos.";
  }

  if (pathname.includes("/admin/hospedes")) {
    return "Consulte e gerencie os hóspedes cadastrados.";
  }

  if (pathname.includes("/admin/acomodacoes")) {
    return "Gerencie unidades, preços, fotos e disponibilidade.";
  }

  if (pathname.includes("/admin/links")) {
    return "Gerencie links úteis e atalhos do sistema.";
  }

  if (pathname.includes("/admin/configuracoes")) {
    return "Gerencie as configurações gerais do sistema.";
  }

  return "Acompanhe a operação da pousada em tempo real.";
}

function isActiveItem(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isAdministrationActive(pathname: string) {
  return administrationItems.some((item) =>
    isActiveItem(pathname, item.href)
  );
}

function SidebarLink({
  item,
  pathname,
  collapsed = false,
  onClick,
}: {
  item: MenuItem;
  pathname: string;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const active = isActiveItem(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-normal transition ${
        active
          ? "bg-[var(--app-primary)] text-white shadow-[0_14px_34px_rgba(39,180,196,0.24)]"
          : "text-white/70 hover:bg-white/[0.07] hover:text-white"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <Icon
        className="h-5 w-5 shrink-0"
        strokeWidth={1.9}
      />

      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">
            {item.label}
          </span>

          {active ? (
            <span className="text-white/75">›</span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [administrationOpen, setAdministrationOpen] =
    useState(false);

  const pageTitle = getPageTitle(pathname);
  const pageSubtitle = getPageSubtitle(pathname);

  const administrationActive =
    isAdministrationActive(pathname);

  useEffect(() => {
    setMounted(true);

    const savedSidebar = window.localStorage.getItem(
      "cpa-admin-sidebar-collapsed"
    );

    const savedTheme = window.localStorage.getItem(
      "cpa-admin-theme"
    );

    const savedAdministration = window.localStorage.getItem(
      "cpa-admin-administration-open"
    );

    if (savedSidebar === "true") {
      setCollapsed(true);
    }

    if (
      savedAdministration === "true" ||
      administrationActive
    ) {
      setAdministrationOpen(true);
    }

    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute(
        "data-theme",
        "dark"
      );
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute(
        "data-theme",
        "light"
      );
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);

    if (administrationActive) {
      setAdministrationOpen(true);
    }
  }, [pathname, administrationActive]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;

      window.localStorage.setItem(
        "cpa-admin-sidebar-collapsed",
        String(next)
      );

      return next;
    });
  }

  function toggleDarkMode() {
    setIsDark((current) => {
      const next = !current;

      if (next) {
        document.documentElement.classList.add("dark");

        document.documentElement.setAttribute(
          "data-theme",
          "dark"
        );

        window.localStorage.setItem(
          "cpa-admin-theme",
          "dark"
        );
      } else {
        document.documentElement.classList.remove("dark");

        document.documentElement.setAttribute(
          "data-theme",
          "light"
        );

        window.localStorage.setItem(
          "cpa-admin-theme",
          "light"
        );
      }

      return next;
    });
  }

  function toggleAdministration() {
    setAdministrationOpen((current) => {
      const next = !current;

      window.localStorage.setItem(
        "cpa-admin-administration-open",
        String(next)
      );

      return next;
    });
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const supabase = createClient();

      await supabase.auth.signOut();

      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair do painel:", error);

      router.replace("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div
      data-theme={isDark ? "dark" : "light"}
      className="cpa-admin-shell min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]"
    >
      {/* SIDEBAR DESKTOP */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen border-r border-white/10 bg-[#071e23] shadow-[12px_0_44px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col ${
          collapsed ? "w-[92px]" : "w-[288px]"
        }`}
      >
        <div className="p-5">
          <Link
            href="/admin/dashboard"
            className={`flex min-h-[70px] items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-3 transition hover:bg-white/[0.09] ${
              collapsed ? "justify-center" : ""
            }`}
            title="Casa Pé n'Areia"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white shadow-[0_12px_28px_rgba(39,180,196,0.22)]">
              <Home
                className="h-6 w-6"
                strokeWidth={1.9}
              />
            </div>

            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  Casa Pé n&apos;Areia
                </p>

                <p className="mt-1 text-xs font-normal text-white/52">
                  Reservation OS
                </p>
              </div>
            ) : null}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-5">
          {!collapsed ? (
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
              Menu
            </p>
          ) : null}

          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>

          <div className="mt-5">
            {collapsed ? (
              <div className="space-y-1.5">
                {administrationItems.map((item) => (
                  <SidebarLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed
                  />
                ))}
              </div>
            ) : (
              <div
                className={`overflow-hidden rounded-[1.45rem] border transition ${
                  administrationActive
                    ? "border-[#27b4c4]/35 bg-[#27b4c4]/10"
                    : "border-white/10 bg-white/[0.035]"
                }`}
              >
                <button
                  type="button"
                  onClick={toggleAdministration}
                  className={`flex min-h-12 w-full items-center gap-3 px-3 text-sm font-medium transition ${
                    administrationActive
                      ? "text-white"
                      : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  aria-expanded={administrationOpen}
                >
                  <ShieldCheck
                    className="h-5 w-5 shrink-0"
                    strokeWidth={1.9}
                  />

                  <span className="min-w-0 flex-1 text-left">
                    Administração
                  </span>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      administrationOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={1.9}
                  />
                </button>

                {administrationOpen ? (
                  <div className="border-t border-white/10 p-2">
                    {administrationItems.map((item) => {
                      const Icon = item.icon;

                      const active = isActiveItem(
                        pathname,
                        item.href
                      );

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${
                            active
                              ? "bg-[var(--app-primary)] text-white shadow-[0_10px_24px_rgba(39,180,196,0.2)]"
                              : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          <Icon
                            className="h-4 w-4 shrink-0"
                            strokeWidth={1.9}
                          />

                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>

                          {active ? (
                            <span className="text-white/75">
                              ›
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {!collapsed ? (
            <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold text-white">
                Atalho público
              </p>

              <p className="mt-2 text-xs font-normal leading-6 text-white/55">
                Veja a página de reservas como o hóspede acessa.
              </p>

              <Link
                href="/"
                target="_blank"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition hover:opacity-90"
                style={{
                  backgroundColor: "var(--app-primary)",
                  color: "#ffffff",
                }}
              >
                Abrir site público
              </Link>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`admin-sidebar-logout-button flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/18 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              collapsed ? "px-0" : "px-4"
            }`}
            title="Sair do painel"
          >
            <LogOut
              className="h-5 w-5"
              strokeWidth={1.9}
            />

            {!collapsed ? (
              isLoggingOut ? "Saindo..." : "Sair"
            ) : null}
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-normal text-white/70 transition hover:bg-white/[0.09] hover:text-white ${
              collapsed ? "px-0" : "px-4"
            }`}
            title={
              collapsed ? "Expandir menu" : "Recolher menu"
            }
          >
            {collapsed ? (
              <PanelLeftOpen
                className="h-5 w-5"
                strokeWidth={1.9}
              />
            ) : (
              <PanelLeftClose
                className="h-5 w-5"
                strokeWidth={1.9}
              />
            )}

            {!collapsed ? "Recolher menu" : null}
          </button>
        </div>
      </aside>

      {/* SIDEBAR MOBILE */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-[288px] overflow-y-auto border-r border-white/10 bg-[#071e23] p-5 shadow-[12px_0_44px_rgba(0,0,0,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
                  <Home
                    className="h-5 w-5"
                    strokeWidth={1.9}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    Casa Pé n&apos;Areia
                  </p>

                  <p className="text-xs font-normal text-white/52">
                    Reservation OS
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-xl text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                aria-label="Fechar menu"
              >
                ×
              </button>
            </div>

            <nav className="mt-6 space-y-1.5">
              {menuItems.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div
              className={`mt-5 overflow-hidden rounded-[1.45rem] border transition ${
                administrationActive
                  ? "border-[#27b4c4]/35 bg-[#27b4c4]/10"
                  : "border-white/10 bg-white/[0.035]"
              }`}
            >
              <button
                type="button"
                onClick={toggleAdministration}
                className={`flex min-h-12 w-full items-center gap-3 px-3 text-sm font-medium transition ${
                  administrationActive
                    ? "text-white"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
                aria-expanded={administrationOpen}
              >
                <ShieldCheck
                  className="h-5 w-5 shrink-0"
                  strokeWidth={1.9}
                />

                <span className="min-w-0 flex-1 text-left">
                  Administração
                </span>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    administrationOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.9}
                />
              </button>

              {administrationOpen ? (
                <div className="border-t border-white/10 p-2">
                  {administrationItems.map((item) => {
                    const Icon = item.icon;

                    const active = isActiveItem(
                      pathname,
                      item.href
                    );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${
                          active
                            ? "bg-[var(--app-primary)] text-white"
                            : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                        }`}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          strokeWidth={1.9}
                        />

                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="mt-7 border-t border-white/10 pt-5">
              <Link
                href="/admin/perfil"
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-normal transition ${
                  pathname.startsWith("/admin/perfil")
                    ? "bg-[var(--app-primary)] text-white"
                    : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <UserRound
                  className="h-5 w-5"
                  strokeWidth={1.9}
                />

                Meu perfil
              </Link>

              <Link
                href="/admin/configuracoes"
                onClick={() => setMobileOpen(false)}
                className={`mt-1.5 flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-normal transition ${
                  pathname.startsWith("/admin/configuracoes")
                    ? "bg-[var(--app-primary)] text-white"
                    : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <Settings
                  className="h-5 w-5"
                  strokeWidth={1.9}
                />

                Configurações
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-4 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/18 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut
                  className="h-5 w-5"
                  strokeWidth={1.9}
                />

                {isLoggingOut ? "Saindo..." : "Sair"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {/* CONTEÚDO */}
      <div
        className={`min-w-0 transition-all duration-300 ${
          collapsed ? "lg:pl-[92px]" : "lg:pl-[288px]"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/92 backdrop-blur-xl">
          <div className="flex min-h-[84px] items-center justify-between gap-4 px-5 md:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)] lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu
                  className="h-5 w-5"
                  strokeWidth={1.9}
                />
              </button>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-primary)]">
                  Admin panel
                </p>

                <h1 className="mt-1 truncate text-xl font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
                  {pageTitle}
                </h1>

                <p className="mt-1 hidden text-sm font-normal text-[var(--admin-muted)] md:block">
                  {pageSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-normal text-[var(--admin-muted)] shadow-sm transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
                title={
                  isDark ? "Ativar modo claro" : "Ativar modo escuro"
                }
              >
                {mounted && isDark ? (
                  <Sun
                    className="h-4 w-4"
                    strokeWidth={1.9}
                  />
                ) : (
                  <Moon
                    className="h-4 w-4"
                    strokeWidth={1.9}
                  />
                )}

                <span className="hidden sm:inline">
                  {mounted && isDark ? "Light" : "Dark"}
                </span>
              </button>

              <Link
                href="/admin/configuracoes"
                className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)] md:flex"
                title="Configurações"
              >
                <Settings
                  className="h-5 w-5"
                  strokeWidth={1.9}
                />
              </Link>

              <Link
                href="/admin/perfil"
                className={`hidden items-center gap-3 rounded-2xl border px-3 py-2 transition md:flex ${
                  pathname.startsWith("/admin/perfil")
                    ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)]"
                    : "border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-soft)]"
                }`}
                title="Abrir meu perfil"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[var(--app-primary)] text-white">
                  <UserRound
                    className="h-5 w-5"
                    strokeWidth={1.9}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--admin-text)]">
                    Meu perfil
                  </p>

                  <p className="text-xs font-normal text-[var(--admin-muted)]">
                    Dados e segurança
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-w-0 px-5 py-6 md:px-7">
          {children}
        </main>
      </div>

      <style jsx global>{`
        html.dark {
          color-scheme: dark;
        }

        html.dark body {
          background: #071e23;
        }

        .admin-sidebar-logout-button,
        .admin-sidebar-logout-button:hover,
        .admin-sidebar-logout-button:focus,
        .admin-sidebar-logout-button:active {
          text-decoration: none !important;
        }

        .admin-sidebar-logout-button svg {
          stroke: currentColor !important;
        }
      `}</style>
    </div>
  );
}

export default AdminShell;
